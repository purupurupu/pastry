---
name: wt-add
description: git worktreeを新規作成する。ブランチ名を指定すると、リポジトリの横にworktreeディレクトリを作成する。
argument-hint: <branch-name>
allowed-tools: Bash
---

git worktreeを作成してください。

## 引数

- ブランチ名: $ARGUMENTS

## 手順

1. 現在のリポジトリ名を取得
2. worktreeのパスを決定: `../<リポジトリ名>-<ブランチ名のスラッシュをハイフンに変換>`
3. 指定されたブランチが既に存在するか確認
4. worktreeを作成:
   - ブランチが存在する場合: `git worktree add <path> <branch>`
   - ブランチが存在しない場合: `git worktree add -b <branch> <path>`
5. 作成したworktreeのパスを報告

## 例

`/wt-add feature/login` を実行すると:
- `../pastry-feature-login/` にworktreeが作成される
- `feature/login` ブランチが作成またはチェックアウトされる
