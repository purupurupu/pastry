# CLAUDE.md

このファイルはClaude Code (claude.ai/code) がこのリポジトリで作業する際のガイダンスを提供します。

## 言語設定

**すべての回答は日本語で行うこと。** コード内のコメントや変数名は英語のままで問題ありません。

## ビルド・開発コマンド

```bash
npm start           # 開発サーバー起動（ホットリロード有効）
npm run lint        # ESLintを.ts/.tsxファイルに実行
npm run package     # 現在のプラットフォーム向けにパッケージ化
npm run make        # 配布用ファイル（dmg, zipなど）を作成
```

## アーキテクチャ

PastryはElectron Forge + Vite + React 19で構築されたmacOS向けクリップボード履歴マネージャーです。

### プロセス構成

```
Main Process (src/main.ts)
├── ClipboardMonitor (src/main/clipboard-monitor.ts) - 500msごとにクリップボードをポーリング
├── Store (src/main/store.ts) - electron-storeによる永続化
└── Tray (src/main/tray.ts) - システムトレイメニュー

Preload Script (src/preload.ts)
└── contextBridgeを通じてelectronAPIを公開

Renderer Process (src/renderer.tsx)
└── App.tsx → ClipboardList.tsx → ClipboardCard.tsx
```

### 主要パターン

**IPC通信**: レンダラーからメインへの通信はすべてpreloadで公開された`window.electronAPI`を使用。ハンドラは`src/main.ts:setupIPC()`で定義。

**クリップボード監視**: `ClipboardMonitor`はMD5ハッシュを使ったポーリングで変更を検出。`text`、`image`、`file`の3タイプをサポート。

**ウィンドウ動作**: フレームレス、透明、macOSのバイブランシー効果。本番環境ではフォーカスを失うと非表示。完全に閉じることはなく、常に非表示になるだけ。グローバルショートカット（デフォルト: `⌘+⌥+V`）で表示切替。

**データ保存**: electron-storeを使用。保存先は`~/Library/Application Support/pastry/config.json`。クリップボード履歴と設定を保存。

### 型定義

`ClipboardItem`/`ClipboardEntry`は3箇所で定義されています（`src/types.ts`、`src/preload.ts`、`src/main/clipboard-monitor.ts`）。変更時は同期を忘れずに。

## Gitワークフロー

- 機能追加・バグ修正は必ず **featureブランチ** を切って作業する
- ブランチ名は `feature/機能名` または `fix/修正内容` の形式
- 作業完了後は **PRを作成** してmainにマージする
- mainブランチに直接コミットしない

## macOS固有の動作

- メニューバーアプリとして動作（Dockアイコンは`app.dock.hide()`で非表示）
- ファイルコピーはosascriptを使用: `osascript -e 'set the clipboard to POSIX file "..."'`
- トレイアイコンはテンプレートイメージ（ライト/ダークモードに自動適応）
