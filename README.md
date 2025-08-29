# Clipboard Manager

A modern, secure clipboard manager for macOS built with Electron and TypeScript.

## Features

- 📋 Clipboard history with up to 25 items (text and images)
- 🖼️ **Image support** - Copy and paste images from clipboard
- ⌨️ Global keyboard shortcuts (⌘+Shift+V)
- 🔒 Secure architecture with context isolation
- 🎨 Beautiful UI with Tailwind CSS
- 🚀 TypeScript + React for modern development
- ⚡ Fast development with Vite and Hot Module Reload
- 🧩 Component-based architecture

## Development Setup

### Prerequisites

- Node.js (v16 or higher)
- npm

### Installation

```bash
npm install
```

### Development

For development with React Hot Module Reload and TypeScript:

```bash
npm run dev
```

This will start:
- Vite dev server on `http://localhost:5173` (React app)
- TypeScript compiler in watch mode
- Electron app pointing to the dev server

For a production build and run:

```bash
npm start
```

### Building

Build the TypeScript and prepare distribution files:

```bash
npm run build
```

### Project Structure

```
clipboard-manager/
├── src/
│   ├── components/      # React components
│   │   ├── App.tsx           # Main app component
│   │   ├── ClipboardItem.tsx # Individual clipboard item
│   │   ├── EmptyState.tsx    # Empty state component
│   │   ├── Header.tsx        # App header
│   │   └── StatusBar.tsx     # Bottom status bar
│   ├── main.ts          # Main Electron process (TypeScript)
│   ├── renderer.tsx     # React entry point
│   ├── preload.js       # Secure preload script
│   ├── index.html       # HTML shell for React app
│   ├── types.d.ts       # TypeScript type definitions
│   └── styles/
│       └── global.css   # Global CSS styles
├── dist/                # Built files
│   ├── assets/          # Vite-built React assets
│   ├── main.js          # Compiled Electron main
│   ├── index.html       # Built HTML
│   └── preload.js       # Copied preload
├── vite.config.ts       # Vite configuration
├── package.json
├── tsconfig.json        # TypeScript configuration
└── README.md
```

## Styling Architecture

- 🎨 **Tailwind CSS**: Utility-first CSS framework via CDN
- 📝 **Global CSS**: Custom styles in `src/styles/global.css`
- 🎯 **Organized Structure**: Separated concerns for maintainability
- 🌈 **Custom Components**: Purple gradient theme with glass effects
- 📱 **Responsive Design**: Optimized for different screen sizes

### Adding Custom Styles

1. **For utility classes**: Add to `src/styles/global.css`
2. **For Tailwind config**: Modify the config in `index.html`
3. **Component-specific**: Use Tailwind classes in HTML

## Security Features

- ✅ **Context Isolation**: Enabled for security
- ✅ **Node Integration**: Disabled in renderer
- ✅ **Secure IPC**: Using preload script for communication
- ✅ **No Remote Module**: Disabled for security

## How Clipboard Monitoring Works

### macOS Native vs Your App

**🍎 macOS System Clipboard:**
- Only holds **1 item** at a time
- **No history** - when you copy something new, the old item is lost forever
- System-wide - any app can read/write to it

**📱 Your Clipboard Manager:**
- **Monitors** the system clipboard every 500ms
- **Saves history** of up to 25 items in memory (text and images)
- **Provides UI** to access old clipboard items with thumbnails for images

### The Process Step by Step

1. **User copies text or images** (⌘+C) anywhere in macOS
2. **macOS updates system clipboard** (overwrites previous content)
3. **Your app checks clipboard every 500ms** for both text and images
4. **If content is new**, your app adds it to its internal history array
5. **React UI updates** to show all historical items with thumbnails for images
6. **User can click any item** to copy it back to system clipboard

### Storage & Privacy

```typescript
// History stored in RAM only (not saved to disk)
private clipboardHistory: ClipboardHistoryItem[] = [];

// Each item can be text or image
interface ClipboardHistoryItem {
  id: string;
  type: 'text' | 'image';
  content: string; // Text content or base64 image data
  timestamp: string;
  preview: string; // Truncated text or image size info
  size?: number; // For images: file size in bytes
}
```

**Key Points:**
- ❌ **Not persistent** - History is lost when app closes
- ✅ **Privacy-focused** - Nothing saved to disk
- ✅ **Fast access** - All data in memory
- ✅ **Limited size** - Max 25 items to prevent memory bloat
- ✅ **Text & Images** - Monitors both text and image clipboard content
- 🖼️ **Image thumbnails** - Shows preview of copied images

### Monitoring Frequency

The app checks the clipboard every **500ms** because:
- **Responsive**: Catches changes quickly
- **Battery-friendly**: Not checking too frequently
- **Reliable**: Doesn't miss clipboard changes
- **CPU-efficient**: Minimal system impact

## Keyboard Shortcuts

- `⌘+Shift+V` - Toggle clipboard window
- `1-9` - Quick access to clipboard items
- `↑/↓` - Navigate clipboard items
- `Enter` - Copy selected item
- `Backspace/Delete` - Delete selected item
- `Escape` - Close window

## Building for Distribution

Create a distributable app:

```bash
npm run dist
```

This will create platform-specific installers in the `dist/` directory.

## Modern Architecture Benefits

- **React + TypeScript**: Component-based architecture with type safety
- **Secure by Default**: Modern Electron security practices
- **Hot Module Reload**: Instant development feedback with Vite
- **Component-Based**: Reusable, maintainable UI components
- **Clean Separation**: Main process, renderer process, and secure IPC
- **Development Tools**: Excellent debugging and development experience
- **Scalable**: Easy to add new features and components
