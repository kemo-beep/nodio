# Welcome to your Expo app 👋

This is an [Expo](https://expo.dev) project created with [`create-expo-app`](https://www.npmjs.com/package/create-expo-app).

## Get started

1. Install dependencies

   ```bash
   npm install
   ```

2. Set up transcription service (choose one option):

   **Option A: Local Whisper Server (Recommended - Free & Private)**

   Quick setup:

   ```bash
   cd server
   ./setup.sh        # First time setup
   ./start.sh        # Start the server
   ```

   Or manually:

   ```bash
   cd server
   pip install -r requirements.txt
   python server.py
   ```

   The server will start on `http://localhost:8000`

   Create a `.env` file in the project root:

   ```bash
   cp .env.example .env
   ```

   Then add to `.env`:

   ```
   EXPO_PUBLIC_WHISPER_SERVER_URL=http://localhost:8000
   EXPO_PUBLIC_TRANSCRIPTION_PROVIDER=local
   ```

   **Note:** For mobile devices, use your computer's local IP instead of `localhost` (e.g., `http://192.168.1.100:8000`)

   See [Server README](./server/README.md) or [Whisper Server Setup Guide](./docs/whisper-server-setup.md) for more details.

   **Option B: OpenAI API (Requires API Key)**

   Create a `.env` file and add:

   ```
   EXPO_PUBLIC_OPENAI_API_KEY=your_openai_api_key_here
   EXPO_PUBLIC_TRANSCRIPTION_PROVIDER=openai
   ```

   Get your API key from [OpenAI Platform](https://platform.openai.com/api-keys)

   **Note:** After adding configuration, restart the Expo development server.

3. Start the app

   ```bash
   npx expo start
   ```

In the output, you'll find options to open the app in a

- [development build](https://docs.expo.dev/develop/development-builds/introduction/)
- [Android emulator](https://docs.expo.dev/workflow/android-studio-emulator/)
- [iOS simulator](https://docs.expo.dev/workflow/ios-simulator/)
- [Expo Go](https://expo.dev/go), a limited sandbox for trying out app development with Expo

You can start developing by editing the files inside the **app** directory. This project uses [file-based routing](https://docs.expo.dev/router/introduction).

## Get a fresh project

When you're ready, run:

```bash
npm run reset-project
```

This command will move the starter code to the **app-example** directory and create a blank **app** directory where you can start developing.

## Learn more

To learn more about developing your project with Expo, look at the following resources:

- [Expo documentation](https://docs.expo.dev/): Learn fundamentals, or go into advanced topics with our [guides](https://docs.expo.dev/guides).
- [Learn Expo tutorial](https://docs.expo.dev/tutorial/introduction/): Follow a step-by-step tutorial where you'll create a project that runs on Android, iOS, and the web.

## Join the community

Join our community of developers creating universal apps.

- [Expo on GitHub](https://github.com/expo/expo): View our open source platform and contribute.
- [Discord community](https://chat.expo.dev): Chat with Expo users and ask questions.
