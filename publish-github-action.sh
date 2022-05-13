#!/bin/bash

# TODO can GitHub actions do any of this for us?
# TODO document the release process:

# Run this on a branch with the following naming convention: release--0.3.0-rc.5
# Pull request that branch into main
# If all tests pass, then create the real release by running this script on the same branch but entering in the real version

set -e

directories=(
    "examples/call_raw"
    "examples/complex_types"
    "examples/counter"
    "examples/cross_canister_calls"
    "examples/func_types"
    "examples/generators"
    "examples/heartbeat"
    "examples/ic_api"
    "examples/imports"
    "examples/init"
    "examples/inline_types"
    "examples/key_value_store"
    "examples/ledger_canister"
    "examples/management_canister"
    "examples/motoko_examples/calc"
    "examples/motoko_examples/counter"
    "examples/optional_types"
    "examples/pre_and_post_upgrade"
    "examples/primitive_types"
    "examples/query"
    "examples/simple_erc20"
    "examples/simple_user_accounts"
    "examples/stable_storage"
    "examples/tuple_types"
    "examples/update"
)

root_dir=$PWD

VERSION=$1

echo "version: $VERSION"

# sed -E -i "s/(\"version\": \")(.*)(\")/\1$VERSION\3/" package.json
# npm install

# if [[ "$VERSION" == *"-rc."* ]];
# then
#     npm publish --tag next
# else
#     npm publish
# fi

# TODO loop through checking for the status instead of sleeping
# echo -e "sleeping for 30 seconds to ensure azle@$VERSION is fully registered on npm"

# sleep 30

for directory in "${directories[@]}"
do
    cd $directory

    sed -E -i "s/(\"azle\": \")(.*)(\")/\1$VERSION\3/" package.json
    # npm install

    cd $root_dir
done

# TODO everything working in action up until here
git add --all
git commit -am "release $VERSION [skip ci]"

# git push origin HEAD
# git push origin $(git rev-parse --abbrev-ref HEAD)
# echo $GITHUB_HEAD_REF
# git push origin $GITHUB_HEAD_REF
git push

git tag $VERSION
git push origin $VERSION