/* --------------------------------------------------------------------------
   Upload Logic
   -------------------------------------------------------------------------- */

/**
 * Upload a single problem to GitHub
 * @param {object} submissionData - Submission data
 * @param {function} cb - Callback
 */
async function uploadOneSolveProblemOnGit(submissionData, cb) {
    const token = await getToken();
    const hook = await getHook();
    if (isNull(token) || isNull(hook)) {
        console.error("Token or Hook is missing.", token, hook);
        return;
    }
    return upload(
        token,
        hook,
        submissionData.code,
        submissionData.readme,
        submissionData.directory,
        submissionData.fileName,
        submissionData.message,
        cb
    );
}

/**
 * Upload to GitHub via API
 * @param {string} token
 * @param {string} hook
 * @param {string} sourceText
 * @param {string} readmeText
 * @param {string} directory
 * @param {string} filename
 * @param {string} commitMessage
 * @param {function} cb
 */
async function upload(token, hook, sourceText, readmeText, directory, filename, commitMessage, cb) {
    const git = new GitHub(hook, token);
    const stats = await getStats();

    let default_branch = stats.branches[hook];
    if (isNull(default_branch)) {
        default_branch = await git.getDefaultBranchOnRepo();
        stats.branches[hook] = default_branch;
    }

    const { refSHA, ref } = await git.getReference(default_branch);

    // Create Blobs
    const source = await git.createBlob(sourceText, `${directory}/${filename}`);
    const readme = await git.createBlob(readmeText, `${directory}/README.md`);

    // Create Tree & Commit
    const treeSHA = await git.createTree(refSHA, [source, readme]);
    const commitSHA = await git.createCommit(commitMessage, treeSHA, refSHA);
    await git.updateHead(ref, commitSHA);

    // Update Stats
    updateObjectDatafromPath(stats.submission, `${hook}/${source.path}`, source.sha);
    updateObjectDatafromPath(stats.submission, `${hook}/${readme.path}`, readme.sha);
    await saveStats(stats);

    if (typeof cb === "function") {
        cb(stats.branches, directory);
    }
}
