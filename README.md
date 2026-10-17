# Wave Music

Wave Music is a React Native Expo app for playing local music and managing your library on iPhone and Android devices.

## Features

- Local music library scanning
- Audio playback controls
- Favorites and playlists
- Queue and player screen workflow
- Device volume handling
- iPhone installation using proper Apple Developer signing

## Tech stack

- React Native
- Expo
- Expo Audio
- Expo Media Library
- iOS native build via Xcode

## Prerequisites

Before running the app on an iPhone, make sure you have:

- macOS with Xcode installed
- An Apple Developer account
- Your iPhone connected to the Mac via USB
- The iPhone trusted on the Mac
- Node.js and npm installed

## Install dependencies

```bash
npm install
```

If CocoaPods is not already installed:

```bash
sudo gem install cocoapods
```

Then install iOS pods:

```bash
cd ios
pod install
cd ..
```

## Run on iPhone

For a real-device install, use the Release configuration. This is the command that works for installing the app on a physical iPhone:

```bash
npx expo run:ios --device "Your iPhone Name" --configuration Release
```

Example:

```bash
npx expo run:ios --device "Ranjeet Kumar’s iPhone" --configuration Release
```

If you only want to start the app in normal dev mode without a Release install, you can use:

```bash
npx expo run:ios --device "Your iPhone Name"
```

### Important iPhone setup notes

1. Open Xcode
2. Go to Xcode → Settings → Accounts
3. Sign in with your Apple Developer account
4. Ensure the app bundle identifier matches the signing profile
5. Make sure the device is selected and trusted

The project bundle identifier is configured as:

```text
com.ranjeet983575.wave-music
```

If the device shows provisioning or signing errors, verify the Apple Team and bundle identifier in Xcode before running the app again.

## Common issues

### App not installing on iPhone

- Check that the device is connected and trusted
- Confirm the Apple Developer team is selected in Xcode
- Ensure the bundle identifier matches the provisioning profile

### App crashes after loading

This version includes safer startup flow and guard checks around device media access and volume APIs. If the app still crashes, check the Xcode device logs and confirm the iPhone has media library permission.

## Start the app normally

To run the Metro bundler and app in development mode:

```bash
npx expo start
```

For a physical iPhone install, prefer this exact command:

```bash
npx expo run:ios --device "Your iPhone Name" --configuration Release

npx expo run:ios --device "Ranjeet Kumar’s iPhone" --configuration Release
```

## Useful debugging command

To inspect the device logs in Xcode:

- Xcode → Window → Devices and Simulators
- Select the iPhone
- Open the device log

## Project status

This version includes the runtime crash fix related to startup media scanning and native volume handling.
