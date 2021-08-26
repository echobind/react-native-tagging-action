const fetch = require('node-fetch');
const core = require('@actions/core');

const getNewTag = tag => {
    const [major, minor, patch] = tag.split('.');
    if (process.env.VERSION_CHANGE_TYPE === 'major') {
        return `${Number(major) + 1}.0.0`;
    } else if (process.env.VERSION_CHANGE_TYPE === 'minor') {
        return `${major}.${Number(minor) + 1}.0`;
    } else if (process.env.VERSION_CHANGE_TYPE === 'patch') {
        return `${major}.${minor}.${Number(patch) + 1}`;
    }

    return tag;
};

const createTag = async (githubAuthToken) => {
    const response = await fetch(
        `${process.env.GITHUB_API_URL}/repos/${process.env.GITHUB_REPOSITORY}/tags`,
        {
            headers: {
                Accept: 'application/vnd.github.v3+json',
                Authorization: `Bearer ${githubAuthToken}`,
            },
        }
    );
    const data = await response.json();
    console.log('data', data);
    const mostRecentTag = data[0].name;
    const [tagVersion, tagVersionNumber] = mostRecentTag.split('-');
    const cleanTag = tagVersion.replace('v', '');
    const newTag = getNewTag(cleanTag);
    const updatedTagVersionNumber =
        cleanTag === newTag ? Number(tagVersionNumber) + 1 : 1;
    const tagName = `v${newTag}-${updatedTagVersionNumber}`;

    await fetch(
        `${process.env.GITHUB_API_URL}/repos/${process.env.GITHUB_REPOSITORY}/releases`,
        {
            body: JSON.stringify({
                owner: 'cardstack',
                repo: 'cardwallet',
                tag_name: tagName,
                target_commitish: process.env.BRANCH_TO_TAG,
                name: `${tagName}`,
                body: `Released at ${new Date(Date.now()).toISOString()}`,
            }),
            method: 'POST',
            headers: {
                Accept: 'application/vnd.github.v3+json',
                Authorization: `Bearer ${githubAuthToken}`,
            },
        }
    );
};

try {
    const githubAuthToken = core.getInput('github-auth-token');

    createTag(githubAuthToken);
} catch (error) {
    core.setFailed(error.message);
}