const fs = require('fs');
const path = require('path');

// Function to convert text to JSON and write it to a file
function textToJson(text, jsonFilePath) {
  // Convert text to array of words
  const words = text.split(/\s+/).filter(Boolean);

  // Write array to .json file
  fs.writeFile(jsonFilePath, JSON.stringify(words), err => {
    if (err) {
      return console.error('Unable to write file: ' + err);
    }
    console.log('Converted to ' + path.basename(jsonFilePath));
  });
}

// Directory path
const dirPath = path.join(__dirname, 'poems');

// Read directory
fs.readdir(dirPath, (err, files) => {
  if (err) {
    return console.error('Unable to scan directory: ' + err);
  }

  // Iterate over all files
  files.forEach(file => {
    // Check if file is a .txt file
    if (path.extname(file) === '.txt') {
      // Read .txt file
      fs.readFile(path.join(dirPath, file), 'utf8', (err, data) => {
        if (err) {
          return console.error('Unable to read file: ' + err);
        }

        // Write text to .json file
        const jsonFileName = path.join(dirPath, path.basename(file, '.txt') + '.json');
        textToJson(data, jsonFileName);
      });
    }
  });
});
