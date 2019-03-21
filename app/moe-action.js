/*
 *  This file is part of Moeditor.
 *
 *  Copyright (c) 2016 Menci <huanghaorui301@gmail.com>
 *  Copyright (c) 2016 lucaschimweg
 *
 *  Moeditor is free software: you can redistribute it and/or modify
 *  it under the terms of the GNU General Public License as published by
 *  the Free Software Foundation, either version 3 of the License, or
 *  (at your option) any later version.
 *
 *  Moeditor is distributed in the hope that it will be useful,
 *  but WITHOUT ANY WARRANTY; without even the implied warranty of
 *  MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
 *  GNU General Public License for more details.
 *
 *  You should have received a copy of the GNU General Public License
 *  along with Moeditor. If not, see <http://www.gnu.org/licenses/>.
 */

'use strict';

const {dialog} = require('electron'),
	  MoeditorFile = require('./moe-file'),
	  Path = require('path');

String.prototype.string = function(len) {
	var s = '',
	i = 0;
	while (i++ < len) {
		s += this;
	}
	return s;
};
String.prototype.zf = function(len) {
	return '0'.string(len - this.length) + this;
};
Number.prototype.zf = function(len) {
	return this.toString().zf(len);
};
Date.prototype.format = function(f) {
	if (!this.valueOf()) return ' ';
	
	var weekName = ['일요일', '월요일', '화요일', '수요일', '목요일', '금요일', '토요일'];
	var d = this;
	let h;
	
	return f.replace(/(yyyy|yy|MM|dd|E|HH|hh|mm|ss|a\/p)/gi, function($1) {
		switch ($1) {
			case 'yyyy':
			return d.getFullYear();
			case 'yy':
			return (d.getFullYear() % 1000).zf(2);
			case 'MM':
			return (d.getMonth() + 1).zf(2);
			case 'dd':
			return d.getDate().zf(2);
			case 'E':
			return weekName[d.getDay()];
			case 'HH':
			return d.getHours().zf(2);
			case 'hh':
			return ((h = d.getHours() % 12) ? h : 12).zf(2);
			case 'mm':
			return d.getMinutes().zf(2);
			case 'ss':
			return d.getSeconds().zf(2);
			case 'a/p':
			return d.getHours() < 12 ? '오전' : '오후';
			default:
			return $1;
		}
	});
};

class MoeditorAction {
	static openNew() {
		moeApp.open();
	}

	static open() {
		const files = dialog.showOpenDialog(
			{
				properties: ['openFile', 'multiSelections'],
				filters: [
					{ name: __("Markdown Documents"), extensions: [ 'md', 'mkd', 'markdown' ] },
					{ name: __("All Files"), extensions: [ '*' ] }
				]
			}
		);

		if (typeof files == 'undefined') return;

		for (var file of files) {
			app.addRecentDocument(file);
			moeApp.open(file);
		}
	}

	static save(w) {
		if (typeof w == 'undefined') w = require('electron').BrowserWindow.getFocusedWindow();
		if (typeof w.moeditorWindow == 'undefined') return false;

		if (typeof w.moeditorWindow.fileName == 'undefined' || w.moeditorWindow.fileName == '') {
			MoeditorAction.saveAs(w);
		} else {
			try {
				MoeditorFile.write(w.moeditorWindow.fileName, w.moeditorWindow.content);
				w.moeditorWindow.fileContent = w.moeditorWindow.content;
				w.moeditorWindow.changed = false;
				w.moeditorWindow.window.setDocumentEdited(false);
				w.moeditorWindow.window.setRepresentedFilename(w.moeditorWindow.fileName);
				w.moeditorWindow.window.webContents.send('pop-message', { type: 'success', content: __('Saved successfully.') });
				moeApp.addRecentDocument(w.moeditorWindow.fileName);
			} catch (e) {
				w.moeditorWindow.window.webContents.send('pop-message', { type: 'error', content: __('Can\'t save file') + ', ' + e.toString() });
				console.log('Can\'t save file: ' + e.toString());
				return false;
			}
		}

		return true;
	}

	static saveAs(w) {
		if (typeof w == 'undefined') w = require('electron').BrowserWindow.getFocusedWindow();
		if (typeof w.moeditorWindow == 'undefined') return false;

		const fileName = dialog.showSaveDialog(w,
			{
				filters: [
					{ name: __("Markdown Documents"), extensions: ['md', 'mkd', 'markdown' ] },
					{ name: __("All Files"), extensions: [ '*' ] }
				]
			}
		);
		if (typeof fileName == 'undefined') return false;
		try {
			MoeditorFile.write(fileName, w.moeditorWindow.content);
			w.moeditorWindow.fileContent = w.moeditorWindow.content;
			w.moeditorWindow.fileName = fileName;
			w.moeditorWindow.changed = false;
			moeApp.addRecentDocument(fileName);
			w.moeditorWindow.window.setDocumentEdited(false);
			w.moeditorWindow.window.setRepresentedFilename(fileName);
			w.moeditorWindow.window.webContents.send('pop-message', { type: 'success', content: __('Saved successfully.') });
			w.moeditorWindow.window.webContents.send('set-title', fileName);
		} catch (e) {
			w.moeditorWindow.window.webContents.send('pop-message', { type: 'error', content: __('Can\'t save file') + ', ' + e.toString() });
			console.log('Can\'t save file: ' + e.toString());
			return false;
		}
	}

	static exportAsHTML(w, f) {
		if (typeof w == 'undefined') w = require('electron').BrowserWindow.getFocusedWindow();
		if (typeof w.moeditorWindow == 'undefined') return;

		const fileName = dialog.showSaveDialog(w,
			{
				filters: [
					{ name: __("HTML Documents"), extensions: ['html', 'htm'] },
				]
			}
		);
		if (typeof fileName == 'undefined') return;
		f((s) => {
			try {
				w.moeditorWindow.window.webContents.send('pop-message', { type: 'info', content: __('Exporting as HTML, please wait ...') });
				MoeditorFile.write(fileName, s);
				const {shell} = require('electron');
				shell.openItem(fileName);
			} catch (e) {
				w.moeditorWindow.window.webContents.send('pop-message', { type: 'error', content: __('Can\'t export as HTML') + ', ' + e.toString() });
				console.log('Can\'t export as HTML: ' + e.toString());
			}
		});
	}

	static exportAsPDF(w, f) {
		if (typeof w == 'undefined') w = require('electron').BrowserWindow.getFocusedWindow();
		if (typeof w.moeditorWindow == 'undefined') return;

		const fileName = dialog.showSaveDialog(w,
			{
				filters: [
					{ name: __("PDF Documents"), extensions: ['pdf'] },
				]
			}
		);
		if (typeof fileName == 'undefined') return;
		f((s) => {
			let errorHandler = (e) => {
				w.moeditorWindow.window.webContents.send('pop-message', { type: 'error', content: __('Can\'t export as PDF') + ', ' + e.toString() });
				console.log('Can\'t export as PDF: ' + e.toString());
			}
			try {
				w.moeditorWindow.window.webContents.send('pop-message', { type: 'info', content: __('Exporting as PDF, please wait ...') });
				const exportPDF = require('./moe-pdf');
				exportPDF({ s: s, path: fileName }, errorHandler);
			} catch (e) {
				errorHandler(e);
			}
		});
	}

	static exportAsBLOG(w, f) {
		if (typeof w == 'undefined') w = require('electron').BrowserWindow.getFocusedWindow();
		if (typeof w.moeditorWindow == 'undefined') return;

		const postjsDR = dialog.showOpenDialog(w,
			{
				title: 'Select posts.js',
				filters: [
					{ name: __("posts.js"), extensions: ['js'] },
				],
				properties: ['openFile'],
			}
		);
		if (typeof postjsDR == 'undefined') return;
		const postjsDRo = postjsDR.join('');

		const folderDR = dialog.showOpenDialog(w,
			{
				title: 'Save Posting',
				properties: ['openDirectory'],
			}
		);
		if (typeof folderDR == 'undefined') return;
		const folderDRo = folderDR.join('');

		f((s, title) => {
			try {
				w.moeditorWindow.window.webContents.send('pop-message', { type: 'info', content: __('Exporting as BLOG, please wait ...') });

				/* read post js */
				let directory = Path.dirname(postjsDRo);
				let postJSONstr = MoeditorFile.read(postjsDRo, '').split('\n');
				postJSONstr = postJSONstr.splice(1, postJSONstr.length).join('\n');
				let postJSON = JSON.parse(postJSONstr);


				let href = Path.join('/', folderDRo.replace(directory, ''));
				/* get match href object */
				let key = Object.keys(postJSON);
				let rtnObj = null;
				for (let i = 0; i < key.length && rtnObj == null; i++) {
					let obj = postJSON[key[i]];
					
					if (obj.type == 'single') {
						if ( obj.href.replace('/posts', '').indexOf(href) == 0 ||
							 obj.href.replace('/posts', '').indexOf(href.replace(/\\/g, '/')) == 0 ) {
							rtnObj = obj;
							break;
						}
					} else if (obj.type == 'dropdown') {
						let child = { obj: obj.posts, key: Object.keys(obj.posts) };
						for (let ci = 0; ci < child.key.length; ci++) {
							let cobj = child.obj[child.key[ci]];
							
							if ( cobj.href.replace('/posts', '').indexOf(href) == 0 ||
								cobj.href.replace('/posts', '').indexOf(href.replace(/\\/g, '/')) == 0 ) {
								rtnObj = cobj;
								break;
							}
						}
					}
				}

				/* object posts push */
				let date = new Date().format('yyyy-MM-dd-HH-mm-ss');
				rtnObj.posts.push({
					href: Path.join('/posts', href, date, '/').replace(/\\/g, '/'),
					icon: 'icon-note',
					title: title,
				});

				/* write posting */
                let targetPath = Path.join(folderDRo, date);
				MoeditorFile.mkDir(targetPath);
				
				if (targetPath) {
					MoeditorFile.write(Path.join(targetPath, '/index.html'), s);
					/* write post.js */
					MoeditorFile.write(postjsDRo, 'const posts = \n' + JSON.stringify(postJSON, null, '\t'));
				}
				
				const {shell} = require('electron');
				shell.openItem(targetPath);
			} catch (e) {
				w.moeditorWindow.window.webContents.send('pop-message', { type: 'error', content: __('Can\'t export as BLOG') + ', ' + e.toString() });
				console.log('Can\'t export as BLOG: ' + e.toString());
			}
		});
	}
}

module.exports = MoeditorAction;
