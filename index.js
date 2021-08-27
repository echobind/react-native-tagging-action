const fetch = require('node-fetch');
const core = require('@actions/core');

/**
 * Bump version based on version change type
 * @param {string} tag ex: 1.0.0
 * @returns updated version (ex: 2.0.0)
 */
const getNewTag = tag => {
    // get input from github action, default to 'none'
    const versionChangeType = core.getInput('version-change-type') || 'none';

    const [major, minor, patch] = tag.split('.');

    if (versionChangeType === 'major') {
        return `${Number(major) + 1}.0.0`;
    } else if (versionChangeType === 'minor') {
        return `${major}.${Number(minor) + 1}.0`;
    } else if (versionChangeType === 'patch') {
        return `${major}.${minor}.${Number(patch) + 1}`;
    }

    return tag;
};

const createTag = async () => {
    // get inputs from github action, with defaults
    const githubAuthToken = core.getInput('github-auth-token');
    const branchToTag = core.getInput('branch-to-tag') || 'main';

    const headers = {
        Accept: 'application/vnd.github.v3+json',
        Authorization: `Bearer ${githubAuthToken}`,
    };

    try {
        // get existing tags
        const tagsResponse = await fetch(
            `${process.env.GITHUB_API_URL}/repos/${process.env.GITHUB_REPOSITORY}/tags`,
            {headers}
        );
        const tagsData = await tagsResponse.json();

        // default if the repository doesn't have any tags created yet
        let mostRecentTag = 'v0.0.1-0';

        if (tagsData && Array.isArray(tagsData) && tagsData[0] && tagsData[0].name) {
            // specify most recent tag if there are existing tags in the repo
            mostRecentTag = tagsData[0].name;
        }

        // get commits to HEAD since most recent tag
        const commitSinceTagUrl = `${process.env.GITHUB_API_URL}/repos/${process.env.GITHUB_REPOSITORY}/compare/${mostRecentTag}...HEAD`;
        const commitsSinceTagResponse = await fetch(commitSinceTagUrl, {headers});
        const commitSinceTagData = await commitsSinceTagResponse.json();

        // generate list of commit messages for release body
        const commitMessages = commitSinceTagData.commits.map((item) =>
            `* ${item.commit.message} ${item.html_url} - @${item.author.login}`
        );

        // break version out from version count (v1.0.0-1 -> v1.0.0 and 1)
        const [tagVersion, tagVersionNumber] = mostRecentTag.split('-');
        // remove 'v' from version
        const cleanTag = tagVersion.replace('v', '');
        // get updated version based on version change type
        const newTag = getNewTag(cleanTag);
        // if the version didn't change, then bump the version count
        const updatedTagVersionNumber =
            cleanTag === newTag ? Number(tagVersionNumber) + 1 : 1;
        // put it all back together
        const tagName = `v${newTag}-${updatedTagVersionNumber}`;

        const [owner, repo] = process.env.GITHUB_REPOSITORY.split('/');

        // generate body for release
        const body = `${commitMessages.join('\n ')}`;

        // create release
        await fetch(
            `${process.env.GITHUB_API_URL}/repos/${process.env.GITHUB_REPOSITORY}/releases`,
            {
                body: JSON.stringify({
                    owner,
                    repo,
                    tag_name: tagName,
                    target_commitish: branchToTag,
                    name: `Release ${tagName}`,
                    body,
                }),
                method: 'POST',
                headers,
            }
        );
    } catch (error) {
        core.setFailed(error.message);
    }
};

createTag();