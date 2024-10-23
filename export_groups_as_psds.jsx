#target photoshop

// Function to check if a group is a layer set
function isGroup(layer) {
    return layer.typename === "LayerSet";
}

// Function to trim based on transparency
function trimDocument() {
    activeDocument.trim(TrimType.TRANSPARENT, true, true, true, true);
}

// Main function
function exportGroupsAsPSD(trim, outputFolder) {
    var originalDoc = app.activeDocument;
    var docName = originalDoc.name.replace(/\.[^\.]+$/, ''); // Remove extension
    //var originalColorProfile = originalDoc.colorProfileName; // Get the color profile name
    var originalColorMode = originalDoc.mode;

    var newColorMode = NewDocumentMode.RGB; // Default to RGB for new documents
    switch (originalColorMode) {
        case DocumentMode.RGB:
            newColorMode = NewDocumentMode.RGB;
            break;
        case DocumentMode.CMYK:
            newColorMode = NewDocumentMode.CMYK;
            break;
        case DocumentMode.GRAYSCALE:
            newColorMode = newDocumentMode.GRAYSCALE;
            break;
        case DocumentMode.LAB:
            newColorMode = newDocumentMode.LAB;
            break;
        case DocumentMode.BITMAP:
            newColorMode = NewDocumentMode.BITMAP;
            break;
        default:
            newColorMode = NewDocumentMode.RGB; // Default to RGB if mode is unrecognized
            break;
    }

    for (var i = 0; i < originalDoc.layerSets.length; i++) {
        var group = originalDoc.layerSets[i];

        // Set the active layer to the group to ensure it's selected
        originalDoc.activeLayer = group;

        // Create a new document for the group with the original color settings
        
        try {
            var groupDoc = app.documents.add(
                originalDoc.width, 
                originalDoc.height, 
                originalDoc.resolution, 
                group.name, 
                newColorMode,
                DocumentFill.TRANSPARENT, 
                originalDoc.pixelAspectRatio,
                originalDoc.bitsPerChannel
            );

        } catch (e) {
            alert("Failed to create document for group '" + group.name + "': " + e.message);
            continue; // Skip to the next group if there's an error
        }

        // Switch back to the original document and duplicate the group to the new document
        app.activeDocument = originalDoc;
        group.duplicate(groupDoc, ElementPlacement.INSIDE);

        // Switch to the new document
        app.activeDocument = groupDoc;

        // Trim the document if the trim option is selected
        if (trim) {
            trimDocument();
        }

        // Save the new document as a PSD in the selected output directory
        try {
            var saveFile = new File(outputFolder + "/" + group.name + ".psd");
            var psdSaveOptions = new PhotoshopSaveOptions();
            psdSaveOptions.layers = true; // Keep layers intact
            groupDoc.saveAs(saveFile, psdSaveOptions, true, Extension.LOWERCASE);
        } catch (e) {
            alert("Failed to save document for group '" + group.name + "': " + e.message);
        }

        groupDoc.close(SaveOptions.DONOTSAVECHANGES);
    }
}

// UI Dialog for trim option and output folder selection
function showDialog() {
    var dlg = new Window('dialog', 'Export Groups as PSDs');
    dlg.alignChildren = 'fill';

    // Trim checkbox
    var trimCheckbox = dlg.add('checkbox', undefined, 'Trim exported groups');
    trimCheckbox.value = false; // Default unchecked

    // Output folder selection
    var folderGroup = dlg.add('group');
    folderGroup.orientation = 'row';
    folderGroup.add('statictext', undefined, 'Output Folder:');
    var folderInput = folderGroup.add('edittext', undefined, '');
    folderInput.characters = 30; // Text box width
    var browseButton = folderGroup.add('button', undefined, 'Browse');

    browseButton.onClick = function() {
        var selectedFolder = Folder.selectDialog('Select output folder');
        if (selectedFolder) {
            folderInput.text = selectedFolder.fsName;
        }
    };

    // OK and Cancel buttons
    var btnGroup = dlg.add('group');
    btnGroup.orientation = 'row';
    var okButton = btnGroup.add('button', undefined, 'OK');
    var cancelButton = btnGroup.add('button', undefined, 'Cancel');

    okButton.onClick = function() {
        if (folderInput.text === '') {
            alert('Please select an output folder.');
        } else {
            dlg.close(1);
        }
    };
    cancelButton.onClick = function() {
        dlg.close(0);
    };

    var result = dlg.show();
    if (result == 1) {
        exportGroupsAsPSD(trimCheckbox.value, folderInput.text);
    }
}

showDialog();
