/**
 * SDK helper tool — generates ready-to-paste init code for any platform
 * using the user's API key and current workspace context.
 */
import { z } from 'zod';
import { defineTool } from './shared.js';

interface AppConfig {
  appScheme?: string;
  iosBundleId?: string;
  androidPackageName?: string;
  iosUniversalLinkDomain?: string;
  androidAppLinkDomain?: string;
  webFallbackUrl?: string;
}

interface SnippetContext {
  apiKey: string;
  baseUrl: string;
  appConfig: AppConfig;
}

function reactNativeSnippet(ctx: SnippetContext): string {
  return `// 1. Install the SDK
//    npm install @linkforty/mobile-sdk-react-native
//
// 2. Initialize once at app startup (e.g. in App.tsx)
import LinkForty from '@linkforty/mobile-sdk-react-native';

LinkForty.init({
  apiKey: '${ctx.apiKey}',
  baseUrl: '${ctx.baseUrl}',
});

// 3. Listen for deep links
LinkForty.onDeepLink((data) => {
  console.log('Deep link data:', data);
  // Navigate based on data.deepLinkParameters
});

// 4. (Optional) Listen for deferred deep links — fires once on first launch
LinkForty.onDeferredDeepLink((data) => {
  if (data) console.log('Install attributed to:', data);
});`;
}

function expoSnippet(ctx: SnippetContext): string {
  return `// 1. Install the SDK
//    npx expo install @linkforty/mobile-sdk-expo
//
// 2. Initialize once at app startup (e.g. in app/_layout.tsx)
import LinkForty from '@linkforty/mobile-sdk-expo';
import { useEffect } from 'react';

export default function RootLayout() {
  useEffect(() => {
    LinkForty.init({
      apiKey: '${ctx.apiKey}',
      baseUrl: '${ctx.baseUrl}',
    });

    LinkForty.onDeepLink((data) => {
      console.log('Deep link data:', data);
    });

    LinkForty.onDeferredDeepLink((data) => {
      if (data) console.log('Install attributed to:', data);
    });
  }, []);

  return /* your app */;
}`;
}

function iosSnippet(ctx: SnippetContext): string {
  return `// 1. Add the LinkForty SDK via Swift Package Manager:
//    https://github.com/linkforty/mobile-sdk-ios
//
// 2. In your AppDelegate or App struct:
import LinkForty

@main
struct YourApp: App {
  init() {
    LinkForty.shared.initialize(
      apiKey: "${ctx.apiKey}",
      baseURL: "${ctx.baseUrl}"
    )

    LinkForty.shared.onDeepLink { data in
      print("Deep link: \\(data)")
    }

    LinkForty.shared.onDeferredDeepLink { data in
      if let data = data {
        print("Install attributed to: \\(data)")
      }
    }
  }

  var body: some Scene {
    WindowGroup { ContentView() }
  }
}

// Bundle ID: ${ctx.appConfig.iosBundleId ?? '(not configured)'}
// Universal Link domain: ${ctx.appConfig.iosUniversalLinkDomain ?? '(not configured)'}`;
}

function androidSnippet(ctx: SnippetContext): string {
  return `// 1. Add to your build.gradle:
//    implementation 'com.linkforty:mobile-sdk-android:1.0.0'
//
// 2. Initialize in your Application class:
import com.linkforty.LinkForty

class MyApp : Application() {
  override fun onCreate() {
    super.onCreate()

    LinkForty.init(
      context = this,
      apiKey = "${ctx.apiKey}",
      baseUrl = "${ctx.baseUrl}"
    )

    LinkForty.onDeepLink { data ->
      Log.d("LinkForty", "Deep link: $data")
    }

    LinkForty.onDeferredDeepLink { data ->
      if (data != null) {
        Log.d("LinkForty", "Install attributed to: $data")
      }
    }
  }
}

// Package name: ${ctx.appConfig.androidPackageName ?? '(not configured)'}
// App Link domain: ${ctx.appConfig.androidAppLinkDomain ?? '(not configured)'}`;
}

function flutterSnippet(ctx: SnippetContext): string {
  return `// 1. Add to pubspec.yaml:
//    dependencies:
//      linkforty: ^1.0.0
//
// 2. Initialize in main.dart:
import 'package:linkforty/linkforty.dart';
import 'package:flutter/material.dart';

void main() async {
  WidgetsFlutterBinding.ensureInitialized();

  await LinkForty.init(
    apiKey: '${ctx.apiKey}',
    baseUrl: '${ctx.baseUrl}',
  );

  LinkForty.onDeepLink((data) {
    print('Deep link: $data');
  });

  LinkForty.onDeferredDeepLink((data) {
    if (data != null) print('Install attributed to: $data');
  });

  runApp(const MyApp());
}`;
}

const snippetGenerators: Record<string, (ctx: SnippetContext) => string> = {
  'react-native': reactNativeSnippet,
  expo: expoSnippet,
  ios: iosSnippet,
  android: androidSnippet,
  flutter: flutterSnippet,
};

export const getSdkInstallSnippetTool = defineTool({
  name: 'get_sdk_install_snippet',
  description:
    'Generate a ready-to-paste SDK initialization snippet for a specific mobile platform. The snippet is pre-filled with the user\'s API key, base URL, and app config (bundle IDs, schemes, link domains) from the current workspace. Supported platforms: react-native, expo, ios, android, flutter. Use this to help a developer integrate LinkForty into their mobile app in under a minute.',
  schema: z.object({
    platform: z.enum(['react-native', 'expo', 'ios', 'android', 'flutter']),
  }),
  handler: async (args, client) => {
    // Pull current workspace and app config so the snippet is fully filled in
    const workspaces = await client.get<Array<{ id: string }>>('/workspaces');
    if (!workspaces?.length) {
      throw new Error('No workspaces accessible by this API key');
    }
    const wsId = workspaces[0].id;
    const appConfig = await client.get<AppConfig>(`/workspaces/${wsId}/app-config`).catch(() => ({}));

    // The MCP server doesn't have direct access to the user's API key string
    // because it lives in process.env. Pull it from the env via the client config.
    // We re-read process.env here since the client doesn't expose the key directly.
    const apiKey = process.env.LINKFORTY_API_KEY ?? 'YOUR_API_KEY';
    const baseUrl = (process.env.LINKFORTY_BASE_URL || 'https://api.linkforty.com/api')
      .replace(/\/api\/?$/, '');

    const generator = snippetGenerators[args.platform];
    if (!generator) throw new Error(`Unsupported platform: ${args.platform}`);

    return {
      platform: args.platform,
      snippet: generator({ apiKey, baseUrl, appConfig }),
      appConfig,
      docs: `https://docs.linkforty.com/sdks/${args.platform}`,
    };
  },
});

export const sdkTools = [getSdkInstallSnippetTool];
