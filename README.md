# Twice-Over
An iterative code review tool supporting cross-iteration diffing and change commenting with syntax highlighting. Built to support Windows environments using TFS and Visual Studio.

## Why another code review tool?
Corporate development shops not willing or able to use version control systems like git or mercurial are stuck in the dark ages when it comes to code reviews. Twice-Over aims to fix this.

## Background
For those who have developed code at Microsoft in recent years and experienced the wonder that is their internal tool CodeFlow, Twice-Over's design will seem familiar. For all others, come and experience the joy of iterative code review!

## Screenshots

![Review dashboard](media/(01) Review dashboard.png)
Starting point when launching the app.


![Create new review and add reviewers with pluggable auto-complete](media/(02) Create new review and add reviewers with pluggable auto-complete.png)
Create a new review and add reviewers with a pluggable auto-completion subsystem.


![Line diff](media/(03) Line diff.png)
Line-based diff view. Several diff modes and are available via buttons in the bottom-left corner.


![Character diff](media/(04) Character diff.png)
Character-based diff view. Choose which view mode you want based on the type of changes in the active file.


![Add comment to any line](media/(05) Add comment to any line.png)
Select one or more lines to add comments.


![Edit code inline when adding comments](media/(06) Edit code inline when adding comments.png)
Add comments to one or more lines and edit the code directly! This cool feature allows you to provide suggested changes directly inline with consistent code formatting and spacing.


![Comments can have discussion threads](media/(07) Comments can have discussion threads.png)
Comments can have discussion threads and multiple iterations. You can add text-based comments alongside code-based comments.


![Review original code in comment view](media/(08) Review original code in comment view.png)
You can also review the originally-authored code easily while in comment view.


![Add Iterations](media/(09) Add Iterations.png)
Once you make changes to your code based on the comments, publish a new iteration and show it off!


![View overall reviewer status and mark complete](media/(10) View overall reviewer status and mark complete.png)
At any time, check out reviewer status and abandon or mark the code review complete.



## Status

Twice-Over is in alpha currently. Here is the current development outline for the project:
### twiceover-client
nw.js-based thick client to support code review creation from changes on the local system.

**Done:**
- TFS integration via subprocess calls to tf.exe, requires Visual Studio 2010+ on the system
- email alias autocomplete via Active Directory queries through subprocess calls to  [EmailChecker](https://github.com/Coldarn/twiceover-emailchecker)
- code file differencing via [jsdiff](https://github.com/kpdecker/jsdiff)
- code syntax highlighting via [Highlight.js](https://github.com/isagalaev/highlight.js)
- adding new iterations and diffing between any pair of them
- inline commenting
- server communication for persisting and loading reviews

**To Do:**
- feature enhancements are now tracked on the [issues page](/../../issues)

### [twiceover-server](https://github.com/Coldarn/twiceover-server)
node.js-based web server to support persisting and hosting reviews along with sending out emails.

**Done:**
- review creation/persistence
- adding comments and iterations to an existing review

**To Do:**
- feature enhancements are now tracked on the [twiceover-server issues page](https://github.com/Coldarn/twiceover-server/issues)
