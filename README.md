# x-editable-plugins
Includes plugins to extends the x-editable package created by Vitaliy Potapov (https://vitalets.github.io/x-editable/index.html).

x-editable is a great tool to implement in-place editing enabled forms. We are using this package at https://plineo.com but we needed some additional functionalities. Having created them, we thought we can share them hopefully they would be helpful for someone else.

To use the plugins, just install the x-editable package by following the link above to the repository, then include whichever JS file that you need for the plugin you wish to use.

## Bootstrap datetime picker
The datepicker field in x-editable is not implemented for Bootstrap 3, so we wrote a plugin that uses the Bootstrap datetime picker package (https://eonasdan.github.io/bootstrap-datetimepicker/)

### Install
You need to first include the datetimepicker files from the repository, and then include the editable-date.js file.

### Details
The plugin replaces the date, and the datetime field type in x-editable to use the same plugin. You can change the format option to get date, datetime or time selection (e.g. DD/MM/YYYY will result in date only selection, DD/MM/YYYY HH:mm will add time selection to it).
By specifying the date type to the x-editable object, the format will default to DD/MM/YYYY
By specifying the datetime type to the x-editable object, the format will default to DD/MM/YYYY HH:mm

## Editable Select2
The Select2 package is a really powerful enhancement for regular dropdowns (https://select2.github.io/examples.html). It supports local data arrays, as well as remote data by using AJAX.
The implementation in x-editable is buggy with the new version of Select2. So we designed this plugin to make use of the full potential of Select2.
We have also updated it to use Twitter's Bloodhound (https://github.com/twitter/typeahead.js/blob/master/doc/bloodhound.md) for better remote data handling (it supports caching better than the default implementation).

### Install
You need to include the Select2 (full) files (js and css) as well as the bloodound.js file from Twitter's typeaheads.js repo. Then include the editable-select2.js

### Details
To use remote data source (using AJAX), you can specify the source (the url to the data source) option in the select2 settings in the options array passed to the x-editable field.
You can also pass a filter setting, which can be a string or a function that returns a string, this filter will be appended to the url when getting data.
