const fetch = require('node-fetch');
const core = require('@actions/core');

const getNewTag = tag => {
    const versionChangeType = core.getInput('version-change-type');

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
    const githubAuthToken = core.getInput('github-auth-token');
    const branchToTag = core.getInput('branch-to-tag');

    const headers = {
        Accept: 'application/vnd.github.v3+json',
        Authorization: `Bearer ${githubAuthToken}`,
    };

    try {
        const response = await fetch(
            `${process.env.GITHUB_API_URL}/repos/${process.env.GITHUB_REPOSITORY}/tags`,
            {headers}
        );
        const data = await response.json();

        let mostRecentTag = 'v0.0.1-0';

        if (data && Array.isArray(data) && data[0] && data[0].name) {
            mostRecentTag = data[0].name;
        }

        const commitSinceTagUrl = `${process.env.GITHUB_API_URL}/repos/${process.env.GITHUB_REPOSITORY}/compare/${mostRecentTag}...HEAD`;
        const commitsSinceTagResponse = await fetch(commitSinceTagUrl, {headers});
        const commitSinceTagData = await commitsSinceTagResponse.json();

        const commitMessages = commitSinceTagData.commits.map((item) =>
            `${item.commit.message} ${item.html_url} - @${item.author.login}`
        );

        const [tagVersion, tagVersionNumber] = mostRecentTag.split('-');
        const cleanTag = tagVersion.replace('v', '');
        const newTag = getNewTag(cleanTag);
        const updatedTagVersionNumber =
            cleanTag === newTag ? Number(tagVersionNumber) + 1 : 1;
        const tagName = `v${newTag}-${updatedTagVersionNumber}`;

        const [owner, repo] = process.env.GITHUB_REPOSITORY.split('/');

        const body = `${commitMessages.join('\n* ')}`;

        await fetch(
            `${process.env.GITHUB_API_URL}/repos/${process.env.GITHUB_REPOSITORY}/releases`,
            {
                body: JSON.stringify({
                    owner,
                    repo,
                    tag_name: tagName,
                    target_commitish: branchToTag,
                    name: `${tagName}`,
                    body,
                }),
                method: 'POST',
                headers,
            }
        );
    } catch (error) {
        console.log('error', error);
        core.setFailed(error.message);
    }
};

createTag();