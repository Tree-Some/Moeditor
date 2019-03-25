/*
 *  This file is part of Moeditor.
 *
 *  Copyright (c) 2016 Menci <huanghaorui301@gmail.com>
 *  Copyright (c) 2015 Thomas Brouard (for codes from Abricotine)
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

const fs = require('fs'),
      path = require('path'),
      mime = require('mime');

class MoeditorFile {
    static mkDir(path) {
        try {
            return fs.mkdirSync(path);
        } catch (e) {
            return false
        }
    }

    static isFile(fileName) {
        try {
            return fs.statSync(fileName).isFile();
        } catch (e) {
            return false;
        }
    }

    static isTextFile(fileName) {
        try {
            if (!fs.statSync(fileName).isFile()) return false;
            var type = mime.lookup(fileName);
            return type && type.substr(0, 4) === 'text';
        } catch (e) {
            return false;
        }
    }

    static isDirectory(fileName) {
        try {
            return fs.lstatSync(fileName).isDirectory();
        } catch (e) {
            return false;
        }
    }

    static read(fileName, empty) {
        try {
            return fs.readFileSync(fileName, {encoding: 'utf8'});
        } catch(e) {
            return empty;
        }
    }

    static write(fileName, content) {
        return fs.writeFileSync(fileName, content);
    }

    static writeAsync(fileName, content, cb) {
        return fs.writeFile(fileName, content, cb);
    }

    static remove(fileName) {
        try {
            fs.unlinkSync(fileName);
        } catch(e) {
            ;
        }
    }

    static copyFileSync( source, target ) { 
        let targetFile = target;
    
        //if target is a directory a new file with the same name will be created
        if ( fs.existsSync( target ) ) { 
            if ( fs.lstatSync( target ).isDirectory() ) { 
                targetFile = path.join( target, path.basename( source ) );
            }   
        }   
    
        fs.writeFileSync(targetFile, fs.readFileSync(source));
    }
    
    static copyFolderRecursiveSync( source, target ) {
        let files = []; 
    
        if ( fs.existsSync( source ) ) {
            //check if folder needs to be created or integrated
            if ( !fs.existsSync( target) ) { 
                fs.mkdirSync( target );
            }   
        
            //copy
            if ( fs.lstatSync( source ).isDirectory() ) { 
                files = fs.readdirSync( source );
                files.forEach( ( file ) => { 
                    let curSource = path.join( source, file );
                    if ( fs.lstatSync( curSource ).isDirectory() ) { 
                        this.copyFolderRecursiveSync( curSource, target );
                    } else {
                        this.copyFileSync( curSource, target );
                    }   
                } );
            }   
        }
    }
}

module.exports = MoeditorFile;
