var App = (function() {
	var search = {}
	window.location.search.substring(1).split('&').forEach(function(val) {
		search[val.split('=')[0]] = decodeURIComponent(val.split('=')[1])
	})
	return {
		events: {},
		on: function(eventName, fn) {
			this.events[eventName] = this.events[eventName] || []
			this.events[eventName].push(fn)
		},
		off: function(eventName, fn) {
			if (this.events[eventName]) {
				for (var i = 0; i < this.events[eventName].length; i++) {
					if (this.events[eventName][i] === fn) {
						this.events[eventName].splice(i, 1)
						break
					}
				}
			}
		},
		emit: function(eventName, data) {
			if (this.events[eventName]) {
				this.events[eventName].forEach(function(fn) {
					fn(data)
				})
			}
		},
		cachedDom: {},
		appointments: {
			isLoading: false,
			list: []
		},
		newAppointmentForm: {
			// if there is an error, server will pass back the values the user entered in the form
			show: 'error' in search ? true : false,
			date: search.date || '',
			epoch: null,
			time: search.time || '',
			description: search.description || ''
		},
		error: function() {
			if ('error' in search) {
				return {
					show: true,
					message: search['error']
				}
			} else {
				return {
					show: false,
					message: ''
				}
			}
		}.bind(this)(),
		todaysDate: (function() {
			var date = new Date()
			var year, month, day
			year = date.getFullYear()
			month = date.getMonth() + 1
			month = month.toString().length === 1 ? '0' + month : month
			day = date.getDate()
			day = day.toString().length === 1 ? '0' + day : day
			return year + '-' + month + '-' + day
		})(),
		addEventListeners: function() {
			this.find('#error-close').on('click', this.closeError.bind(this))
			this.find('#new-appointment-btn').on('click', this.toggleNewAppointmentForm.bind(this))
			this.find('#new-appointment-form-cancel').on('click', this.toggleNewAppointmentForm.bind(this))
			this.find('#new-appointment-form-date').on('change', this.updateNewAppointmentForm.bind(this))
			this.find('#new-appointment-form-time').on('input', this.updateNewAppointmentForm.bind(this))
			this.find('#new-appointment-form-description').on('input', this.updateNewAppointmentForm.bind(this))
			this.find('#appointments-search-form').on('submit', this.searchAppointments.bind(this))

			this.on('appointments loading', this.renderAppointmentsLoading.bind(this))
			this.on('error changed', this.renderError.bind(this))
			this.on('new appointment form updated', this.calculateNewAppointmentEpoch.bind(this))
			this.on('new appointments received', this.renderAppointmentsTable.bind(this))
			this.on('toggle new appointment form', this.renderNewAppointmentForm.bind(this))
		},
		cacheDom: function() {
			var selectorsToCache = [
				'#appointments-search-form',
				'#error-close',
				'#error-container',
				'#error-message',
				'#new-appointment-btn',
				'#new-appointment-form',
				'#new-appointment-form-cancel',
				'#new-appointment-form-date',
				'#new-appointment-form-description',
				'#new-appointment-form-epoch',
				'#new-appointment-form-time',
				'#results-table tbody',
				'#results-table',
				'#results-table-container',
				'#results-table-loading'
			]
			selectorsToCache.map(
				function(selector) {
					this.cachedDom[selector] = $(selector)
				}.bind(this)
			)
		},
		calculateNewAppointmentEpoch: function(valueUpdated) {
			if (valueUpdated === 'date' || valueUpdated === 'time' || typeof valueUpdated === 'undefined') {
				this.newAppointmentForm.epoch = Date.parse(
					this.newAppointmentForm.date + ' ' + this.newAppointmentForm.time
				)
			}
			this.renderNewAppointmentFormData(this.newAppointmentForm)
		},
		closeError: function() {
			this.error.show = false
			this.emit('error changed', this.error)
		},
		find: function(selector) {
			if (typeof this.cachedDom[selector] === 'undefined') {
				// console.warn('Querying uncached DOM element.')
				return $(selector)
			} else {
				return this.cachedDom[selector]
			}
		},
		getAppointments: function(searchQuery) {
			var endpoint = searchQuery
				? '/appointments.cgi?query=' + encodeURIComponent(searchQuery.trim())
				: '/appointments.cgi?query='
			this.appointments.isLoading = true
			this.emit('appointments loading', this.appointments.isLoading)
			$.get(
				endpoint,
				function(data) {
					data.forEach(
						function(appt) {
							// parses epoch into date & time strings to be displayed in table
							var date = new Date(appt.appointmentEpoch)
							var year, month, day
							year = date.getFullYear()
							month = date.getMonth() + 1
							month = month.toString().length === 1 ? '0' + month : month
							day = date.getDate()
							day = day.toString().length === 1 ? '0' + day : day
							appt['appointmentDate'] = year + '-' + month + '-' + day
							var hours, minutes, amOrPm
							hours = date.getHours()
							minutes = date.getMinutes()
							amOrPm = hours >= 12 ? 'PM' : 'AM'
							hours = hours > 12 ? hours - 12 : hours
							hours = hours == 0 ? (hours = 12) : hours
							minutes = minutes.toString().length === 1 ? '0' + minutes : minutes
							appt['appointmentTime'] = hours + ':' + minutes + ' ' + amOrPm
						}.bind(this)
					)
					this.appointments.list = data
					this.appointments.isLoading = false
					this.emit('new appointments received', data)
					this.emit('appointments loading', this.appointments.isLoading)
				}.bind(this)
			)
		},
		init: function() {
			this.cacheDom()
			this.addEventListeners()
			this.calculateNewAppointmentEpoch()
			this.initialRender()
		},
		renderNewAppointmentForm: function(newAppointmentForm) {
			if (!newAppointmentForm.show) {
				this.find('#new-appointment-form').addClass('hide')
				this.find('#new-appointment-btn').removeClass('hide')
			} else {
				this.find('#new-appointment-form').removeClass('hide')
				this.find('#new-appointment-btn').addClass('hide')
			}
		},
		renderNewAppointmentFormData: function(newAppointmentForm) {
			for (var key in newAppointmentForm) {
				if (key !== 'show') {
					this.find('#new-appointment-form-' + key).val(newAppointmentForm[key])
				}
			}
		},
		renderAppointmentsLoading: function(appointmentsLoading) {
			if (appointmentsLoading) {
				this.find('#results-table-loading').removeClass('hide')
				this.find('#results-table-container').addClass('hide')
			} else {
				this.find('#results-table-loading').addClass('hide')
				this.find('#results-table-container').removeClass('hide')
			}
		},
		renderError: function(error) {
			if (error.show) {
				this.find('#error-container').removeClass('hide')
				this.find('#error-message').text(error.message)
			} else {
				this.find('#error-container').addClass('hide')
			}
		},
		initialRender: function() {
			this.renderNewAppointmentFormData(this.newAppointmentForm)
			this.renderError(this.error)
			this.renderNewAppointmentForm(this.newAppointmentForm)
		},
		renderAppointmentsTable: function() {
			var entityMap = {
				'&': '&amp;',
				'<': '&lt;',
				'>': '&gt;',
				'"': '&quot;',
				"'": '&#39;',
				'/': '&#x2F;',
				'`': '&#x60;',
				'=': '&#x3D;'
			}
			// protect against xss attacks
			var escapeHtml = function(string) {
				return String(string).replace(/[&<>"'`=\/]/g, function(s) {
					return entityMap[s]
				})
			}
			var body = this.find('#results-table tbody')
			body.html('')
			this.appointments.list.map(
				function(appt) {
					var tr = $('<tr></tr>')
					tr.append('<td>' + escapeHtml(appt.appointmentDate) + '</td>')
					tr.append('<td>' + escapeHtml(appt.appointmentTime) + '</td>')
					tr.append('<td>' + escapeHtml(appt.appointmentDescription) + '</td>')
					body.append(tr)
				}.bind(this)
			)
		},
		searchAppointments: function(e) {
			e.preventDefault()
			this.getAppointments(e.target.elements[0].value)
		},
		toggleNewAppointmentForm: function() {
			this.newAppointmentForm.show = !this.newAppointmentForm.show
			this.emit('toggle new appointment form', this.newAppointmentForm)
		},
		updateNewAppointmentForm: function(event) {
			var newValue = event.target.value
			// last part of the id will be the key we update
			var valueToUpdate = event.target.id.split('-')[3]
			this.newAppointmentForm[valueToUpdate] = newValue
			this.emit('new appointment form updated', valueToUpdate)
		}
	}
})()

$().ready(function() {
	document.getElementById('new-appointment-form-date').min = App.todaysDate
	App.init()
	App.getAppointments()
})
