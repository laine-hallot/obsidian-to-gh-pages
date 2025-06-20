#! /bin/bash

PROJECT_PATH=$( cd -- "$( dirname -- "${BASH_SOURCE[0]}" )" &> /dev/null && pwd )
cd $PROJECT_PATH

set -o allexport
source ./.env
set +o allexport

if [ ! -d "$VAULT_PATH" ]; then
  echo "No vault found at $VAULT_PATH"
  exit
fi;

cd "$VAULT_PATH"
mkdir -p .obsidian/plugins
ln -sf "$PROJECT_PATH/" "$VAULT_PATH/.obsidian/plugins"