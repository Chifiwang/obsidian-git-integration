import { App, Editor, MarkdownView, Modal, Notice, Plugin, PluginSettingTab, Setting } from 'obsidian';
import * as path from 'path';

// Remember to rename these classes and interfaces!

interface MyPluginSettings {
	vaultPath: string
	saveSchema: int
	saveDepth: int
	n_max: int
	n_curr: int
}

interface SaveSchema {
	onMajSave: int
	onSave: int
	onClose: int
	fileOnly: int
	parentDir: int
	wholeVault: int
}

const DEFAULT_SETTINGS: MyPluginSettings = {
	vaultPath: '',
	saveSchema: 0,
	saveDepth: 0,
	n_max: 2,
	n_curr: 0,
}

const SAVE_SCHEMA: SaveSchema = {
	onMajSave: 0,
	onSave: 1,
	onClose: 2,
	wholeVault: 0,
	fileOnly: 1,
	parentDir: 2,
}

export default class MyPlugin extends Plugin {
	settings: MyPluginSettings;

	async onload() {
		await this.loadSettings();

		// get the vault path
		const VAULT_PATH = this.app.vault.adapter.getBasePath();
		this.settings.vaultPath = VAULT_PATH;

		this.saveSettings();

		// push then pull on load
		var gitCmd = `git -C "${this.settings.vaultPath}" push`;
		this.runGit(gitCmd);
		var gitCmd = `git -C "${this.settings.vaultPath}" pull`;
		this.runGit(gitCmd);

		// Save functionality
		this.registerEvent(
			this.app.vault.on("modify", (file: TFile) => {
				// Do something when this file is saved
				if (file.extension === "md") {
					this.onFileSave(file);
				}
			})
		);

		this.addCommand({
			id: "git-add",
			name: "git add",
			editorCallback: (editor, view) => {
				const file = view.file;
				var gitCmd = `git -C "${path.join(this.settings.vaultPath, path.dirname(file.path))}" add "${file.name}"`;
				this.runGit(gitCmd);
			}
		});

		this.addCommand({
			id: "git-push",
			name: "git push",
			editorCallback: (editor, view) => {
				var gitCmd = `git -C "${this.settings.vaultPath}" push`;
				this.runGit(gitCmd);
			}
		});

		this.addCommand({
			id: "git-pull",
			name: "git pull",
			editorCallback: (editor, view) => {
				var gitCmd = `git -C "${this.settings.vaultPath}" pull`;
				this.runGit(gitCmd);
			}
		});

		this.addCommand({
			id: "git-commit",
			name: "git commit",
			editorCallback: (editor, view) => {
				new InputModal(this.app, (result) => {
					const gitCmd = `git -C "${this.settings.vaultPath}" commit -m "${result}"`
					this.runGit(gitCmd);
				}, "Commit Message").open();
			}
		});

		this.addCommand({
			id: "git-command",
			name: "git command",
			editorCallback: (editor, view) => {
				new InputModal(this.app, (result) => {
					const gitCmd = `git -C "${this.settings.vaultPath}" ${result}`
					this.runGit(gitCmd);
				}, "Command").open();
			}
		})
		// This adds a settings tab so the user can configure various aspects of the plugin
		this.addSettingTab(new SampleSettingTab(this.app, this));
	}

	onunload() {
		// console.log("push:", this.settings.vaultPath);
		var gitCmd = `git -C "${this.settings.vaultPath}"`;
		var gitCommitPush = ` && ${gitCmd} commit -m "automated commit" && ${gitCmd} push`;
		var fullCmd = `${gitCmd} add . ${gitCommitPush}`;
		this.runGit(fullCmd);
		console.log("Tried to Push Changes to Remote");
	}

	async runGit(gitCmd: string) {
		const { exec } = require('child_process');

		exec(gitCmd, (error, stdout, stderr) => {
		  if (error) {
			console.error(`exec error: ${error}`);
			return;
		  }
		  console.log(`stdout: ${stdout}`);
		  console.error(`stderr: ${stderr}`);
		});
	}

	async onFileSave(file: TFile) {
		var fullCmd = '';
		if (this.settings.saveDepth === SAVE_SCHEMA.wholeVault) {
			var gitCmd = `git -C "${this.settings.vaultPath}"`;
		} else {
			var gitCmd = `git -C "${path.join(this.settings.vaultPath, path.dirname(file.path))}"`;
		}


		// console.log(gitCmd);
		// this.runGit(gitCmd, 'status')

		// Add
		if (this.settings.saveDepth === SAVE_SCHEMA.fileOnly) {
			var gitAdd = ` add "${file.name}"`;
		} else {
			var gitAdd = ' add .';
		}

		fullCmd = gitCmd + gitAdd;
		// await this.runGit(gitCmd, gitAdd);

		// commit
		if (this.settings.saveSchema === SAVE_SCHEMA.onMajSave) {
			this.settings.n_curr += 1;

			if (this.settings.n_curr === this.settings.n_max) {
				this.settings.n_curr = 0;
				var gitCommitPush = ` && ${gitCmd} commit -m "automated commit" && ${gitCmd} push`;
			}
		} else if (this.settings.saveSchema === SAVE_SCHEMA.onSave) {
			var gitCommitPush = ` && ${gitCmd} commit -m "automated commit" && ${gitCmd} push`;
		} else {
			var gitCommitPush = '';
		}

		fullCmd += gitCommitPush;
		this.runGit(fullCmd);
	}

	async loadSettings() {
		this.settings = Object.assign({}, DEFAULT_SETTINGS, await this.loadData());
	}

	async saveSettings() {
		await this.saveData(this.settings);
		console.log(this.settings);
	}
}

class InputModal extends Modal {
  onSubmit: (result: string) => void;
  placeholder_str: string;

  constructor(app: App, onSubmit: (result: string) => void, placeholderString: string) {
    super(app);
    this.onSubmit = onSubmit;
	this.placeholder_str = placeholderString
  }

  onOpen() {
    const { modalEl, contentEl } = this;
	modalEl.querySelector(".modal-close-button")?.remove();
	modalEl.querySelector(".modal-header")?.remove();
	modalEl.addClass("cmd-input");

    // let inputEl: HTMLInputElement;

	  // Label
	  // const label = contentEl.createEl("label", { text: "Commit Message:" });

	  // Input field
	  const inputEl = contentEl.createEl("input", {
		type: "text",
		placeholder: this.placeholder_str,
	  });
	  inputEl.style.width = "100%";

	  // Submit button
	 //  const button = contentEl.createEl("button", { text: "Submit" });
	 //  button.addEventListener("click", () => {
		// this.close();
		// this.onSubmit(inputEl.value);
	 //  });

	  // Optional: press Enter to submit
	  inputEl.addEventListener("keypress", (e) => {
		if (e.key === "Enter") {
		  this.close();
		  this.onSubmit(inputEl.value);
		}
	  });

  //   new Setting(contentEl)
  //     // .setName("Enter text")
  //     .addText(text => {
  //       inputEl = text.inputEl;
		// inputEl.placeholder = "Commit Message";
  //     });
		//
  //   new Setting(contentEl)
  //     .addButton(btn =>
  //       btn.setButtonText("Submit")
  //          .setCta()
  //          .onClick(() => {
  //            this.close();
  //            this.onSubmit(inputEl.value);
  //          })
  //     );

  }

  onClose() {
    this.contentEl.empty();
  }
}

class SampleSettingTab extends PluginSettingTab {
	plugin: MyPlugin;

	constructor(app: App, plugin: MyPlugin) {
		super(app, plugin);
		this.plugin = plugin;
	}

	display(): void {
		const {containerEl} = this;

		containerEl.empty();

		new Setting(containerEl)
			.setName('Git Repository Location')
			.setDesc('Sets the Git Repository Directiory')
			.addText(text => text
				.setPlaceholder('Enter your secret')
				.setValue(this.plugin.settings.vaultPath)
				.onChange(async (value) => {
					this.plugin.settings.mySetting = value;
					await this.plugin.saveSettings();
				}));

		new Setting(containerEl)
			.setName('Save Schema')
			.setDesc('Sets the push frequency')
			.addDropdown((dropdown) =>
			   dropdown
				  .addOption(SAVE_SCHEMA.onMajSave, 'On Major Save')
				  .addOption(SAVE_SCHEMA.onSave, 'Every Save')
				  .addOption(SAVE_SCHEMA.onClose, 'Only On Close')
				  .setValue(this.plugin.settings.saveSchema)
				  .onChange(async (value) => {
					 this.plugin.settings.saveSchema = parseInt(value, 10);
					 await this.plugin.saveSettings();
				  }));

		new Setting(containerEl)
			.setName('Save Depth')
			.setDesc('Sets the commit depth')
			.addDropdown((dropdown) =>
			   dropdown
				  .addOption(SAVE_SCHEMA.wholeVault, 'Whole Vault')
				  .addOption(SAVE_SCHEMA.fileOnly, 'Current File')
				  .addOption(SAVE_SCHEMA.ParentDir, 'Current Directory')
				  .setValue(this.plugin.settings.saveDepth)
				  .onChange(async (value) => {
					 this.plugin.settings.saveDepth = parseInt(value, 10);
					 await this.plugin.saveSettings();
				  }));

		new Setting(containerEl)
			.setName('Major Save Frequency')
			.setDesc('A major save is considered after n updates to any files')
			.addSlider(slider =>
				slider
					.setDynamicTooltip(this.plugin.settings.n_max)
					.onChange(async (value) => {
						this.plugin.settings.n_max = value;
						await this.plugin.saveSettings();
					}));
	}
}
