(function (global) {
	global.FileSelect = function (params) {
		var self = this;
		self.selector = params.selector;
		self.progress = params.progress || document.createElement('div');
		self.reader = {
			close: true,
			file: undefined,
			reader: undefined,
			last_chunk: 0,
		};

		self.events = {
			chunk_read: [],
			start_read: [],
			end_read: [],
			change: []
		};

		self.event_types = [];
		for (var evtype in self.events) self.event_types.push(evtype);

		self.eventsRun = function (ev, obj) {
			if (self.event_types.indexOf(ev) != -1) {
				for (var i=0; i<self.events[ev].length; i++) {
					var cur = self.events[ev][i];
					if (typeof(cur) == 'function') cur(obj);
				}
			} else {
				throw (self.public.EXCEPTIONS.UNKNOWN_EVENT);
			}
		};

		self.currentReader = Object.create(self.reader);
		self.currentReader.reset = function () {
			self.currentReader = Object.create(self.reader);
		};

		self.public = {};
		self.public.EXCEPTIONS = {
			UNKNOWN_FILE: 'unknown file',
			ANOTHER_FILE_READ: 'another file read',
			READ_ERROR: 'read error',
			FILE_CLOSE: 'file close',
			UNKNOWN_EVENT: 'unknown event',
			UNKNOWN_EVENT_INDEX: 'unknown event index'
		};

		self.public.addEventListener = function (ev, func) {
			if (self.event_types.indexOf(ev) != -1) {
				return self.events[ev].push(func);
			} else {
				throw (self.public.EXCEPTIONS.UNKNOWN_EVENT);
			}
		}

		self.public.removeEventListener = function (ev, index) {
			if (self.event_types.indexOf(ev) != -1) {
				if (index > 0 && index <= (self.events[ev].length-1)) {
					return self.events[ev].splice(index,1);
				} else {
					throw (self.public.EXCEPTIONS.UNKNOWN_EVENT_INDEX)
				}
			} else {
				throw (self.public.EXCEPTIONS.UNKNOWN_EVENT);
			}
		}

		self.public.events_list = [];
		for (var evtype in self.events) self.public.events_list.push(evtype);

		self.update = function (ev) {
			var files = {};
			var filenames = [];
			for (var i = 0; i < self.selector.files.length; i++) {
				var cur = self.selector.files[i];
				files[cur.name] = cur;
				filenames.push(cur.name);
			}

			self.files = files;
			self.filenames = filenames;

			self.eventsRun('change', ev)
		};

		self.selector.addEventListener('change', self.update);

		self.public.getFileList = function() {
			var l = [];
			for (var i=0; i<self.filenames.length; i++) {
				l.push(self.filenames[i]);
			}

			return l;
		};

		self.public.startReadFile = function (filename, chunk_size) {
			if (self.filenames.indexOf(filename) != -1) {
				if (self.currentReader.close) {
					self.currentReader.close = false;

					self.currentReader.reader = new FileReader();
					self.currentReader.reader.onload = function (ev) {
						self.public.lastChunk = ev;
						self.eventsRun('chunk_read', ev);
					}
					self.currentReader.file = self.files[filename];
					self.currentReader.chunk_size = chunk_size || 512;
					self.eventsRun('start_read', filename);
					return true;
				} else {
					throw (self.public.EXCEPTIONS.ANOTHER_FILE_READ);
					return false;
				}
			} else {
				throw (self.public.EXCEPTIONS.UNKNOWN_FILE);
				return false;
			}
		}

		self.public.getChunk = function () {
			if (!self.currentReader.close) {
				var start = self.currentReader.last_chunk,
					end = self.currentReader.last_chunk+self.currentReader.chunk_size;

				var blob = self.currentReader.file.slice(start, end);
				return self.currentReader.reader.readAsBinaryString(blob);
			} else {
				throw (self.public.EXCEPTIONS.FILE_CLOSE);
			}
		}

		self.public.nextChunk = function () {
			if (self.public.lastChunk.loaded == 0 && self.public.lastChunk.total == 0) {
				self.eventsRun('end_read', filename);
				return self.currentReader.reset();
			}
			self.currentReader.last_chunk = self.currentReader.last_chunk + self.currentReader.chunk_size;
		}

		return self.public;
	}
})(this);

