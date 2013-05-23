# dojo

**dojo** is the foundation package of the Dojo Toolkit. Sometimes referred to as the “core”, it contains the most
generally applicable sub-packages and modules. The dojo package covers a wide range of functionality like AJAX, DOM
manipulation, class-type programming, events, promises, data stores, drag-and-drop and internationalization libraries.

## Installing

Dojo can be installed a number of ways.  It is directly downloadable from [dojotoolkit.org/download][download] in a
number of ways.  It is also available on both the Google and Yandex (for Europe) CDNs.  To utilise the CDN, include
the following in your web page for Google:

```xml
<script src="//ajax.googleapis.com/ajax/libs/dojo/1.9.0/dojo/dojo.js"></script>
```

And for Yandex:

```xml
<script src="//yandex.st/dojo/1.9.0/dojo/dojo.js"></script>
```

You can install via [cpm][]:

```bash
$ cpm install dojo
```

Or you can install via [volo][]:

```bash
$ volo add dojo/dojo
```

## Getting Started

If you are starting out with Dojo, the following resources are available to you:

* [Tutorials][]
* [Reference Guide][]
* [API Documentation][]
* [Community Forum][]

## License and Copyright

The Dojo Toolkit (including this package) is dual licensed under "New" BSD and AFL.  For more information on the license
please see the [License Information][].  The Dojo Toolkit is Copyright (c) 2005-2013, The Dojo Foundation.  All rights
reserved.

[download]: http://dojotoolkit.org/download/
[Tutorials]: http://dojotoolkit.org/documentation/
[Reference Guide]: http://dojotoolkit.org/reference-guide/
[API Documentation]: http://dojotoolkit.org/api/
[License Information]: http://dojotoolkit.org/license