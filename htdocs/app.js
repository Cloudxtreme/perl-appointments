var App = (function() {
	var search = {}
	window.location.search.substring(1).split('&').forEach(function(val) {
		search[val.split('=')[0]] = decodeURIComponent(val.split('=')[1])
	})
	return {
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
		calculateNewAppointmentEpoch: function() {
			this.newAppointmentForm.epoch = Date.parse(
				this.newAppointmentForm.date + ' ' + this.newAppointmentForm.time
			)
		},
		closeError: function() {
			this.error.show = false
			this.render()
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
			this.render()
			$.get(
				endpoint,
				function(data) {
					data.forEach(
						function(appt) {
							// parses epoch into date strings to be displayed in table
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
					this.renderAppointmentsTable()
					this.render()
				}.bind(this)
			)
		},
		init: function() {
			this.cacheDom()
			this.addEventListeners()
		},
		render: function() {
			// errors from server
			if (this.error.show) {
				this.find('#error-container').removeClass('hide')
				this.find('#error-message').text(this.error.message)
			} else {
				this.find('#error-container').addClass('hide')
			}
			// show or hide new appointment form
			if (!this.newAppointmentForm.show) {
				this.find('#new-appointment-form').addClass('hide')
				this.find('#new-appointment-btn').removeClass('hide')
			} else {
				this.find('#new-appointment-form').removeClass('hide')
				this.find('#new-appointment-btn').addClass('hide')
			}
			// enforce data integrity
			this.calculateNewAppointmentEpoch()
			for (var key in this.newAppointmentForm) {
				if (key !== 'show') {
					this.find('#new-appointment-form-' + key).val(this.newAppointmentForm[key])
				}
			}
			// show or hide table loading animation
			if (this.appointments.isLoading) {
				this.find('#results-table-loading').removeClass('hide')
				this.find('#results-table-container').addClass('hide')
			} else {
				this.find('#results-table-loading').addClass('hide')
				this.find('#results-table-container').removeClass('hide')
			}
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
			this.render()
		},
		updateNewAppointmentForm: function(event) {
			var newValue = event.target.value
			// last part of the id will be the key we update
			var valueToUpdate = event.target.id.split('-')[3]
			this.newAppointmentForm[valueToUpdate] = newValue

			// if the date or time was updated, recalculate the epoch
			if (valueToUpdate === 'date' || valueToUpdate === 'time') {
				this.calculateNewAppointmentEpoch()
				this.render()
			}
		}
	}
})()

$().ready(function() {
	document.getElementById('new-appointment-form-date').min = App.todaysDate
	App.init()
	App.getAppointments()
})
