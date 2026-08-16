#!/usr/bin/env bash
# Publica o `dist` no branch gh-pages. O branch é só o build: histórico nenhum,
# recriado do zero a cada publicação.
set -euo pipefail

cd "$(dirname "$0")/.."

remote=$(git remote get-url origin)
rev=$(git rev-parse --short HEAD)

rm -rf .deploy
cp -r dist .deploy
cd .deploy

git init -q
git checkout -qb gh-pages
git add -A
git commit -qm "Build de $rev"

# O branch é publicado de um repositório temporário, que não herda credencial
# nenhuma. Com remote HTTPS, o token do `gh` resolve; com SSH, a chave já resolve.
if [[ "$remote" == https://* ]] && command -v gh >/dev/null; then
  git -c credential.helper='!f() { echo username=x-access-token; echo "password=$(gh auth token)"; }; f' \
    push -qf "$remote" gh-pages
else
  git push -qf "$remote" gh-pages
fi

cd ..
rm -rf .deploy

echo "publicado a partir de $rev"
