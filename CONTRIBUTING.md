# Contributing to UI5 Inspector

You want to contribute to UI5 Inspector? Welcome! Please read this document to understand what you can do:
 * [Help Others](#help-others)
 * [Analyze Issues](#analyze-issues)
 * [Report an Issue](#report-an-issue)
 * [Contribute Code](#contribute-code)

## Help Others

You can help UI5 Inspector by helping others who use it and need support. You will find them e.g. on [StackOverflow](http://stackoverflow.com/questions/tagged/sapui5) or in the [SAP Community Network forum](http://scn.sap.com/community/developer-center/front-end/content).

## Analyze Issues

Analyzing issue reports can be a lot of effort. Any help is welcome!
Go to [the Github issue tracker](https://github.com/SAP/ui5-inspector/issues?state=open) and find an open issue which needs additional work or a bugfix.

Additional work may be further information, or a minimized jsbin example or gist, or it might be a hint that helps understanding the issue. Maybe you can even find and [contribute](#contribute-code) a bugfix?


## Report an Issue

If you find a bug - you are welcome to report it.
We can only handle well-reported, actual bugs, so please follow the guidelines below and use forums like [StackOverflow](http://stackoverflow.com/questions/tagged/sapui5) for support questions or when in doubt whether the issue is an actual bug.

Once you have familiarized with the guidelines, you can go to the [Github issue tracker for UI5 Inspector](https://github.com/SAP/ui5-inspector/issues/new) to report the issue.

### Quick Checklist for Bug Reports

Issue report checklist:
 * Real, current bug
 * No duplicate
 * Reproducible
 * Good summary
 * Well-documented
 * Minimal example
 * One bug per report
 * Use the [template](docs/bugreport_template.txt)


### Requirements for a bug report

These seven requirements are the mandatory base of a good bug report:
 1. **Only real bugs**: please do your best to make sure to only report real bugs in UI5 Inspector! Do not report:
   * issues caused by application code or any code outside UI5 Inspector.
   * something that behaves just different from what you expected. A bug is when something behaves different than specified. When in doubt, ask in a forum.
   * something you do not get to work properly. Use a support forum like stackoverflow to request help.
   * feature requests. Well, this is arguable: critical or easy-to-do enhancement suggestions are welcome, but we do not want to use the issue tracker as wishlist.
 2. No duplicate: you have searched the issue tracker to make sure the bug has not yet been reported
 3. Good summary: the summary should be specific to the issue
 4. Current bug: the bug can be reproduced in the most current version (state the tested version!)
 5. Reproducible bug: there are clear steps to reproduce given. This includes:
   * a URL to access the example
   * any required user/password information (do not reveal any credentials that could be mis-used!)
   * detailed and complete step-by-step instructions to reproduce the bug
 6. Precise description:
   * precisely state the expected and the actual behavior
   * give information about the used browser and its version.
   * if the bug is about wrong UI appearance, attach a screenshot and mark what is wrong
   * generally give as much additional information as possible. (But find the right balance: do not invest hours for a very obvious and easy to solve issue. When in doubt, give more information.)
 7. Minimal example: it is highly encouraged to provide a minimal example to reproduce in e.g. jsbin: isolate the application code which triggers the issue and strip it down as much as possible as long as the issue still occurs. If several files are required, you can create a gist. This may not always be possible and sometimes be overkill, but it always helps analyzing a bug.
 8. Only one bug per report: open different tickets for different issues

You are encouraged to use [this template](docs/bugreport_template.txt).

Please report bugs in English, so all users can understand them.


### Issue handling process

When an issue is reported, a committer will look at it and either confirm it as a real issue (by giving the "approved" label), close it if it is not an issue, or ask for more details. Approved issues are then either assigned to a committer in GitHub, reported in our internal issue handling system, or left open as "contribution welcome" for easy or not urgent fixes.

An issue that is about a real bug is closed as soon as the fix is committed. The closing comment explains which patch version of UI5 Inspector will contain the fix.


### Reporting Security Issues

If you find a security issue, please act responsibly and report it not in the public issue tracker, but directly to us, so we can fix it before it can be exploited:
 * SAP Customers: if the found security issue is not covered by a published security note, please report it by creating a customer message at https://service.sap.com/message.
 * Researchers/non-Customers: please send the related information to secure@sap.com using [PGP for e-mail encryption](http://global.sap.com/pc/security/keyblock.txt).
Also refer to the general [SAP security information page](http://www54.sap.com/pc/tech/application-foundation-security/software/security-at-sap/report.html).


### Usage of Labels

Github offers labels to categorize issues. We defined the following labels so far:

Labels for issue categories:
 * bug: this issue is a bug in the code
 * documentation: this issue is about wrong documentation
 * enhancement: this is not a bug report, but an enhancement request

Status of open issues:
 * unconfirmed: this report needs confirmation whether it is really a bug (no label; this is the default status)
 * approved: this issue is confirmed to be a bug
 * author action: the author is required to provide information
 * contribution welcome: this fix/enhancement is approved and you are invited to contribute it

Status/resolution of closed issues:
 * fixed: a fix for the issue was provided
 * duplicate: the issue is also reported in a different ticket and is handled there
 * invalid: for some reason or another this issue report will not be handled further (maybe lack of information or issue does not apply anymore)
 * works: not reproducible or working as expected
 * wontfix: while acknowledged to be an issue, a fix cannot or will not be provided

The labels can only be set and modified by committers.


### Issue Reporting Disclaimer

We want to improve the quality of UI5 Inspector and good bug reports are welcome! But our capacity is limited, so we cannot handle questions or consultation requests and we cannot afford to ask for required details. So we reserve the right to close or to not process insufficient bug reports in favor of those which are very cleanly documented and easy to reproduce. Even though we would like to solve each well-documented issue, there is always the chance that it won't happen - remember: UI5 Inspector is Open Source and comes without warranty.

Bug report analysis support is very welcome! (e.g. pre-analysis or proposing solutions)


## Contribute Code

You are welcome to contribute code to UI5 Inspector in order to fix bugs or to implement new features.

There are three important things to know:

1.  You must be aware of the Apache License (which describes contributions) and **agree to the Developer Certificate of Origin**. This is common practice in Open Source projects. To make this process as simple as possible, we are using *[CLA assistant](https://cla-assistant.io/)*. CLA assistant is an open source tool that integrates with GitHub very well and enables a one-click-experience for accepting the DCO.
2.  There are **several requirements regarding code style, quality, and product standards** which need to be met (we also have to follow them). The respective section below gives more details on the coding guidelines.
3.  **Not all proposed contributions can be accepted**. Some features may e.g. just fit a third-party add-on better. The code must fit the overall direction of OpenUI5 and really improve it, so there should be some "bang for the byte". For most bug fixes this is a given, but major feature implementation first need to be discussed with one of the OpenUI5 committers (the top 20 or more of the [Contributors List](https://github.com/SAP/ui5-inspector/graphs/contributors)), possibly one who touched the related code recently. The more effort you invest, the better you should clarify in advance whether the contribution fits: the best way would be to just open an enhancement ticket in the issue tracker to discuss the feature you plan to implement. We will then forward the proposal to the respective code owner, this avoids disappointment.

### Developer Certificate of Origin

When you contribute (code, documentation, or anything else), you have to be aware that your contribution is covered by the same [Apache 2.0 License](http://www.apache.org/licenses/LICENSE-2.0) that is applied to UI5 Inspector itself.
In particular you need to agree to the DCO.
(This applies to all contributors, including those contributing on behalf of a company). If you agree to its content, you simply have to click on the link posted by the CLA assistant as a comment to the pull request. Click it to check the DCO, then accept it on the following screen if you agree to it. CLA assistant will save this decision for upcoming contributions and will notify you if there is any change to the DCO in the meantime.


### Contribution Content Guidelines

Contributed content can be accepted if it:

1. is useful to improve UI5 Inspector (explained above)
2. follows the applicable guidelines and standards

The second requirement could be described in entire books and would still lack a 100%-clear definition, so you will get a committer's feedback if something is not right. Extensive conventions and guidelines documentation is [available here](docs/guidelines.md).

These are some of the most important rules to give you an initial impression:

-   Apply a clean coding style adapted to the surrounding code, even though we are aware the existing code is not fully clean
-   Use variable and CSS class naming conventions like in the other files you are seeing
-   No global variables
-   Run the JSHint and ESLint code check and make it succeed
-   Comment your code where it gets non-trivial
-   Keep an eye on performance and memory consumption, properly destroy objects when not used anymore
-   Try to write slim and "modern" HTML and CSS, avoid using images and affecting any content in the inspected page/app
-   Avoid `!important` in the CSS files and don't apply outer margins to reusable UI elements; make them work also when positioned absolutely
-   Do not use event.preventDefault(); or event.stopPropagation(); without a good reason or without documentation why it is really required
-   Write unit tests
-   Do not do any incompatible changes, especially do not modify the name or behavior of public API methods or properties
-   Always consider the developer who USES your code!
    -   Think about what code and how much code he/she will need to write to use your feature
    -   Think about what she/he expects your code/feature to do

If this list sounds lengthy and hard to achieve - well, that's what WE have to comply with as well, and it's by far not complete…

### How to contribute - the Process

1.  Make sure the change would be welcome (e.g. a bugfix or a useful feature); best do so by proposing it in a GitHub issue
2.  Create a branch forking the ui5-inspector repository and do your change
3.  Commit and push your changes on that branch
    -   When you have several commits, squash them into one (see [this explanation](http://davidwalsh.name/squash-commits-git)) - this also needs to be done when additional changes are required after the code review

4.  In the commit message follow the [commit message guidelines](docs/guidelines.md#git-guidelines) 

5.  If your change fixes an issue reported at GitHub, add the following line to the commit message: 
    - ```Fixes https://github.com/SAP/ui5-inspector/issues/(issueNumber)```
    - Do NOT add a colon after "Fixes" - this prevents automatic closing.
	- When your pull request number is known (e.g. because you enhance a pull request after a code review), you can also add the line ```Closes https://github.com/SAP/ui5-inspector/pull/(pullRequestNumber)```
6.  Create a Pull Request to github.com/SAP/ui5-inspector
7.  Follow the link posted by the CLA assistant to your pull request and accept it, as described in detail above.
8.  Wait for our code review and approval, possibly enhancing your change on request
    -   Note that the UI5 Inspector developers also have their regular duties, so depending on the required effort for reviewing, testing and clarification this may take a while

9.  Once the change has been approved we will inform you in a comment
10.  Your pull request cannot be merged directly into the branch (internal SAP processes), but will be merged internally and immediately appear in the public repository as well. Pull requests for non-code branches (like "gh-pages" for the website) can be directly merged.
11.  We will close the pull request, feel free to delete the now obsolete branch
