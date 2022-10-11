const path = require('path');
const core = require('@actions/core');
const github = require('@actions/github');
const exec = require('@actions/exec');

const run = async () => {
    core.info('Setup octokit');
    const octokit = github.getOctokit(process.env.GITHUB_TOKEN);
    const { owner, repo } = github.context.repo;

    core.info('Fetch latest release info');
    const latestRelease = await octokit.rest.repos.getLatestRelease({
        owner,
        repo,
    });

    core.info('Set variables');
    const version = latestRelease.data.tag_name.slice(1);

    core.info('Update files version field');
    await exec.exec('node', [path.join(process.env.GITHUB_WORKSPACE, './scripts/update-version.js'), version]);

    await exec.exec('git', ['config', '--global', 'user.name', 'github-actions']);
    await exec.exec('git', ['config', '--global', 'user.email', 'actions@users.noreply.github.com']);
    await exec.exec('git', ['checkout', '-b', `bump-version-${version}`]);
    await exec.exec('git', ['commit', '-am', `chore: release ${version}`]);
    await exec.exec('git', ['push', '-u', 'origin', `bump-version-${version}`]);
    await exec.exec('gh', ['pr', 'create', '--fill']);
};

run()
    .then(() => core.info('Updated files version successfully'))
    .catch(error => core.setFailed(error.message));
