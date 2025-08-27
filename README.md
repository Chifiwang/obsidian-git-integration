# Obsidian Git Integration
enables automatic git commits and pushes to a remote repo on save or periodically for Obsidian vaults

# Set-up
## Pre-requisites
If you are building from scratch you need `npm`, otherwise just having `git` on your computer's `PATH` is enough
To check if you have `git` on your path, in a terminal run `git --version`, if you encounter an error then it is not on your path.

## Install the plugin
To do this take the release or clone and build the project in your `.obsidian/plugins` folder.

## Create a git repository for your obsidian vault
To do this run
```
git init
```
where you want your git repository. By default, obsidian-git-integration will assume that the git repository is the entire vault. If you don't want your whole repositiory to be a git repository, go into the settings and change the repository to the full path to your repo.


