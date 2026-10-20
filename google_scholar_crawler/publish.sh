#!/usr/bin/env bash
set -euo pipefail

# Build the data-only branch without checking it out or altering the source index.
repo_root=$(git rev-parse --show-toplevel)
cd "$repo_root"
stats_dir=google_scholar_crawler/results
for name in gs_data.json gs_data_shieldsio.json; do
  test -s "$stats_dir/$name"
done

index_dir=$(mktemp -d)
trap 'rm -rf "$index_dir"' EXIT
export GIT_INDEX_FILE="$index_dir/index"
git read-tree --empty
for name in gs_data.json gs_data_shieldsio.json; do
  blob=$(git hash-object -w "$stats_dir/$name")
  git update-index --add --cacheinfo "100644,$blob,$name"
done
tree=$(git write-tree)
parent_args=()
if git ls-remote --exit-code --heads origin refs/heads/google-scholar-stats; then
  git fetch --no-tags origin refs/heads/google-scholar-stats
  parent=$(git rev-parse FETCH_HEAD)
  if [ "$tree" = "$(git rev-parse "$parent^{tree}")" ]; then
    echo 'Statistics unchanged.'
    exit 0
  fi
  parent_args=(-p "$parent")
else
  remote_status=$?
  # Exit status 2 means the branch does not exist; access failures must stop.
  if [ "$remote_status" -ne 2 ]; then exit "$remote_status"; fi
fi
export GIT_AUTHOR_NAME='github-actions[bot]'
export GIT_AUTHOR_EMAIL='41898282+github-actions[bot]@users.noreply.github.com'
export GIT_COMMITTER_NAME="$GIT_AUTHOR_NAME"
export GIT_COMMITTER_EMAIL="$GIT_AUTHOR_EMAIL"
commit=$(git commit-tree "$tree" "${parent_args[@]}" -m 'Update Google Scholar statistics')
git push origin "$commit:refs/heads/google-scholar-stats"
