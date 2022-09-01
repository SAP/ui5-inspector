const path = require('path');
const fsPromises = require('fs').promises;
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
    const version = latestRelease.data.tag_name;
    const filePaths = [{
        filePath: 'package.json',
        formatSpaces: 2
    }, {
        filePath: 'app/manifest.json',
        formatSpaces: 4
    }];

    core.info('Update files version field');
    for (let fileObj of filePaths) {
        let { filePath, formatSpaces } = fileObj;
        filePath = path.join(process.env.GITHUB_WORKSPACE, filePath);
        const content = await fsPromises.readFile(filePath);
        const parsedContent = JSON.parse(content);
        const newVersion = version.slice(1);

        if (parsedContent.version === newVersion) {
            core.info('No new version to update!');
            return;
        }

        parsedContent.version = newVersion;
        await fsPromises.writeFile(filePath, JSON.stringify(parsedContent, null, formatSpaces));
    }

    await exec.exec('git', ['config', '--global', 'user.name', 'UI5 Inspector BOT']);
    await exec.exec('git', ['config', '--global', 'user.email', 'actions@users.noreply.github.com']);
    await exec.exec('git', ['commit', '-am', `chore: release ${version}`]);
    await exec.exec('git', ['push', '-u', 'origin', `HEAD:master`]);
};

run()
    .then(() => core.info('Updated files version successfully'))
    .catch(error => core.setFailed(error.message));
