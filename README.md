# Fairy Guardian v3.0.1 Pages Fix

画面が白地の通常HTML表示になる場合、`css` と `js` フォルダがGitHubへアップロードされていません。

## 推奨アップロード方法

このZIPを展開し、ZIPの中身をすべてリポジトリ直下へ置いてください。

```text
index.html
.nojekyll
css/style.css
js/main.js
js/game.js
js/input.js
js/stage.js
js/fairy.js
js/chick.js
```

GitHub Pagesの設定は `Deploy from a branch`、対象を `main / (root)` にします。

## すぐ試す方法

フォルダ構成を気にせず確認したい場合は、`single-file.html` を `index.html` に名前変更してアップロードしてください。CSSとJavaScriptが1ファイルに内蔵されています。
