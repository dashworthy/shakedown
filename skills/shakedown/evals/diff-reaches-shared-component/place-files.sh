#!/usr/bin/env bash
# Builds a repo whose main branch holds files/base and whose close-tickets branch adds files/head.
set -eu
here="$(dirname "$0")"
commit() { git -c user.name=eval -c user.email=eval@example.com commit -qm "$1"; }
cp -R "$here/files/base/." .
git init -q -b main
git add -A && commit "Tickets and projects"
git checkout -qb close-tickets
cp -R "$here/files/head/." .
git add -A && commit "Close a ticket with a reason"
