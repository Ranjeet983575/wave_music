import React, { forwardRef, useCallback, useEffect, useImperativeHandle, useMemo, useRef } from 'react';
import { View } from 'react-native';
import {
    Audio,
    AudioContext,
    AudioManager,
    useAudioTagContext,
} from 'react-native-audio-api';
import { EQ_FREQUENCIES } from '../../constants/theme';

const REVERB_PROFILES = {
    Room: { seconds: 0.55, decay: 5, level: 0.12 },
    Cathedral: { seconds: 2.8, decay: 2.2, level: 0.22 },
    Chamber: { seconds: 1.35, decay: 3.2, level: 0.18 },
};

function createImpulseResponse(context, reverb) {
    const profile = REVERB_PROFILES[reverb] || REVERB_PROFILES.Room;
    const length = Math.ceil(context.sampleRate * profile.seconds);
    const impulse = context.createBuffer(2, length, context.sampleRate);

    for (let channel = 0; channel < impulse.numberOfChannels; channel += 1) {
        const data = impulse.getChannelData(channel);
        for (let sample = 0; sample < length; sample += 1) {
            const decay = Math.pow(1 - sample / length, profile.decay);
            data[sample] = (Math.random() * 2 - 1) * decay;
        }
    }

    return impulse;
}

function AudioStatusReporter({ onStatusChange }) {
    const { ready, playbackState, currentTime, duration } = useAudioTagContext();

    useEffect(() => {
        onStatusChange({ isLoaded: ready, playing: playbackState === 'playing' || playbackState === 'buffering', currentTime, duration });
    }, [currentTime, duration, onStatusChange, playbackState, ready]);

    return null;
}

const EqualizedAudioPlayer = forwardRef(function EqualizedAudioPlayer({
    source,
    equalizerEnabled,
    eqLevels,
    preamp,
    bassBoost,
    selectedReverb,
    volume,
    volumeLimit,
    playbackRate,
    pitchCorrection,
    onStatusChange,
    onEnded,
    onError,
}, ref) {
    const context = useMemo(() => new AudioContext(), []);
    const audioRef = useRef(null);
    const graphRef = useRef(null);
    const statusChangeRef = useRef(onStatusChange);
    const errorRef = useRef(onError);
    statusChangeRef.current = onStatusChange;
    errorRef.current = onError;

    const reportStatus = useCallback((status) => {
        statusChangeRef.current(status);
    }, []);

    const applyLevels = useCallback((graph) => {
        graph.preamp.gain.value = equalizerEnabled ? Math.pow(10, (preamp * 12) / 20) : 1;
        graph.bands.forEach((filter, index) => {
            filter.gain.value = equalizerEnabled ? (eqLevels[index] - 0.5) * 24 : 0;
        });
        graph.bass.gain.value = equalizerEnabled ? bassBoost * 12 : 0;
    }, [bassBoost, equalizerEnabled, eqLevels, preamp]);

    const applyReverb = useCallback((graph) => {
        const profile = REVERB_PROFILES[selectedReverb];
        if (!profile) {
            if (graph.reverbConnected) {
                graph.bass.disconnect(graph.convolver);
                graph.convolver.disconnect();
                graph.wet.disconnect();
                graph.reverbConnected = false;
            }
            graph.wet.gain.value = 0;
            return;
        }

        if (graph.reverbType !== selectedReverb) {
            graph.convolver.buffer = createImpulseResponse(context, selectedReverb);
            graph.reverbType = selectedReverb;
        }
        if (!graph.reverbConnected) {
            graph.bass.connect(graph.convolver);
            graph.convolver.connect(graph.wet);
            graph.wet.connect(graph.output);
            graph.reverbConnected = true;
        }
        graph.wet.gain.value = profile.level;
    }, [context, selectedReverb]);

    const disposeGraph = useCallback(() => {
        const graph = graphRef.current;
        if (!graph) return;

        [graph.source, graph.preamp, ...graph.bands, graph.bass, graph.dryOutput, graph.convolver, graph.wet, graph.output]
            .forEach((node) => node.disconnect());
        graphRef.current = null;
    }, []);

    const createGraph = useCallback(() => {
        if (graphRef.current?.sourcePath === source) {
            applyLevels(graphRef.current);
            applyReverb(graphRef.current);
            return;
        }

        disposeGraph();
        const audioTag = audioRef.current;

        if (!audioTag || typeof audioTag.getFileSourceNode !== 'function') {
            const error = new Error('The audio source is not ready for equalizer processing.');
            errorRef.current(error);
            return;
        }

        const createdNodes = [];
        try {
            const fileSourceNode = audioTag.getFileSourceNode();
            if (!fileSourceNode) return;

            const sourceNode = context.createMediaElementSource(audioTag);
            createdNodes.push(sourceNode);
            const preampNode = context.createGain();
            createdNodes.push(preampNode);
            preampNode.gain.value = 1;
            const bands = [];
            EQ_FREQUENCIES.forEach((frequency) => {
                const filter = context.createBiquadFilter();
                createdNodes.push(filter);
                filter.type = 'peaking';
                filter.frequency.value = Math.min(frequency, context.sampleRate / 2);
                filter.Q.value = 1.1;
                filter.gain.value = 0;
                bands.push(filter);
            });
            const bass = context.createBiquadFilter();
            createdNodes.push(bass);
            bass.type = 'lowshelf';
            bass.frequency.value = 110;
            bass.gain.value = 0;

            sourceNode.connect(preampNode);
            let previousNode = preampNode;
            bands.forEach((filter) => {
                previousNode.connect(filter);
                previousNode = filter;
            });
            previousNode.connect(bass);

            const dryOutput = context.createGain();
            createdNodes.push(dryOutput);
            dryOutput.gain.value = 1;
            bass.connect(dryOutput);

            const convolver = context.createConvolver();
            createdNodes.push(convolver);
            const wet = context.createGain();
            createdNodes.push(wet);
            wet.gain.value = 0;

            const output = context.createGain();
            createdNodes.push(output);
            output.gain.value = 1;
            dryOutput.connect(output);
            output.connect(context.destination);

            graphRef.current = {
                source: sourceNode,
                preamp: preampNode,
                bands,
                bass,
                dryOutput,
                convolver,
                wet,
                output,
                reverbType: null,
                reverbConnected: false,
                sourcePath: source,
            };
            applyLevels(graphRef.current);
            applyReverb(graphRef.current);
        } catch (error) {
            createdNodes.forEach((node) => node.disconnect());
            graphRef.current = null;
            errorRef.current(error instanceof Error ? error : new Error(String(error)));
        }
    }, [applyLevels, applyReverb, context, disposeGraph, source]);

    const createGraphAfterLoad = useCallback(() => {
        Promise.resolve().then(createGraph);
    }, [createGraph]);

    useEffect(() => {
        AudioManager.setAudioSessionOptions({
            iosCategory: 'playback',
            iosMode: 'default',
            iosOptions: [],
        });

        return () => {
            disposeGraph();
        };
    }, [context, disposeGraph]);

    useEffect(() => {
        return () => disposeGraph();
    }, [disposeGraph, source]);

    useEffect(() => {
        const graph = graphRef.current;
        if (!graph) return;

        applyLevels(graph);
    }, [applyLevels]);

    useEffect(() => {
        const graph = graphRef.current;
        if (graph) applyReverb(graph);
    }, [applyReverb]);

    useImperativeHandle(ref, () => ({
        play: async () => {
            try {
                await context.resume();
                await audioRef.current?.play();
            } catch (error) {
                errorRef.current(error instanceof Error ? error : new Error(String(error)));
            }
        },
        pause: () => audioRef.current?.pause(),
        seekTo: (seconds) => audioRef.current?.seekToTime(seconds),
        setVolume: (nextVolume) => audioRef.current?.setVolume(nextVolume),
        setPlaybackRate: (rate) => audioRef.current?.setPlaybackRate(rate),
    }), [context]);

    useEffect(() => {
        audioRef.current?.setVolume(Math.min(volume, volumeLimit));
    }, [volume, volumeLimit]);

    useEffect(() => {
        audioRef.current?.setPlaybackRate(playbackRate);
    }, [playbackRate]);

    return (
        <View pointerEvents="none" style={{ width: 0, height: 0, overflow: 'hidden' }}>
            <Audio
                ref={audioRef}
                source={source}
                context={context}
                volume={Math.min(volume, volumeLimit)}
                playbackRate={playbackRate}
                preservesPitch={pitchCorrection}
                onLoad={createGraphAfterLoad}
                onPositionChange={(currentTime) => reportStatus({ currentTime })}
                onEnded={onEnded}
                onError={onError}
            >
                <AudioStatusReporter onStatusChange={reportStatus} />
            </Audio>
        </View>
    );
});

export default EqualizedAudioPlayer;
