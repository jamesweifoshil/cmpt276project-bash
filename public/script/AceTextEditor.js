var editor = ace.edit("editor", {
    theme: "ace/theme/monokai",
    mode: "ace/mode/javascript",
    placeholder: "choose file to edit"
}); 

function openCode(files) {
var file = files[0];
if (!file) return;
var modelist = ace.require("ace/ext/modelist")
var modeName = modelist.getModeForPath(file.name).mode 
editor.session.setMode(modeName)
reader = new FileReader();
reader.onload = function() {
  editor.session.setValue(reader.result)
}  
reader.readAsText(file) 
}

function setSynataxHighlighting() {
editor.session.setMode(document.getElementById('textEditorHighlighting').value);
}


$(function() {
});

function writeFileUsingFileSaver() {
  var myArray = editor.session.getDocument().$lines;
  myArray.forEach(element => {
    element = element.replace(/([^\r])\n/g, "");
  });

  for(var i = 1; i < myArray.length; i+=2) {
    myArray.splice(i,0,'\n');
  }

var blob = new Blob(myArray);
// var blob = new Blob(myArray, {type:'javascript',endings:'native'});
var editorFileName = document.getElementById('editorFileName').value;
var editorFileExtension = document.getElementById('editorFileName').value;
window.saveAs(blob, document.getElementById('editorFileName').value + document.getElementById('editorFileExtension').value);
}

function onWriteClick() {
    writeFileUsingFileSaver();
}