# React Native Tagging Action

This action automates the GitHub version tagging and releasing process for mobile applications.

Versions tagged by this action will be of the form `v1.0.0-1`. For more details on this, read about the [Tagging Process](#tagging-process).

For a more complete description of how this action could be utilized within a mobile release process, read [this blog post](https://blog.echobind.com/automated-react-native-release-tagging-using-github-actions-d30d9ee52c05).

## Usage

```yaml
- uses: echobind/react-native-tagging-action
  with:
    # A personal access token for the user that will be tagging and publishing the releases
    github-auth-token: '****'
    # The name of the branch the tag should be created off of (defaults to 'main')
    branch-to-tag: 'main'
    # Type of version change to make ('major', 'minor', 'patch', 'none' - defaults to 'none')
    version-change-type: 'none'
```

For an example workflow using this action, refer to [the example](https://github.com/DominicSherman/react-native-tagging-action/blob/master/.github/workflows/example.yml).

## Tagging Process

The process for tagging utilized by this action is specific to mobile apps and allows for the usual major, minor, and patch version bumps, as well as no version bump.

As an example, if your most recent tagged version is `v1.0.0-1`:
* A **major** bump will result in `v2.0.0-1`
* A **minor** bump will result in `v1.1.0-1`
* A **patch** bump will result in `v1.0.1-1`
* No bump being indicated will result in `v1.0.0-2`.

It is done this way to allow for multiple tagged releases of a mobile app within the same version, since the actual version of the app (`1.0.0` in this scenario) only needs to be changed once the previous version has been published publicly. For example, there could be 5 different releases on version `1.0.0` that are sent to internal/beta testers only but not published.

This also allows for scheduled tagging/releasing of your app internally with no bump specified by default.

## Releasing

In addition to creating a tag off of the HEAD of the specified branch, a release will also be created in GitHub for the given tag. 

The title of this release will be of the form `Release ${versionNumber}`, and the body will include a list of all commits to the branch since the previous tag. 

Commits will be listed in the form `${commitMessage} ${sha} - ${author}`. 