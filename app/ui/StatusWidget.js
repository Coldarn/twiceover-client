define([
    'App',
    'util/Util',
    'util/PasteFilter',
    'ui/Component',
    'om/User'
], function (App, Util, PasteFilter, Component, User) {
    'use strict';

    function buildIcon(icon) {
        return `<span class="fa ${icon.icon}" title="${icon.label}" data-status="${icon.name}"></span>`;
    }

    var proto = {
        __proto__: Component.prototype,

        iconSet: null,      // Set of status icons
        user: null,         // User whose status is tracked by this widget
        status: null,       // Status of this User
        comment: null,      // User's status comment

        initComponent: function () {
            this.query('img').attr('src', this.user.getAvatarUrl(44)).attr('title', this.user.toString());
            this.query('.inactive label').text(this.user.toString());

            this.iconEl = this.query('.icon-container');
            this.commentEl = this.query('.comment-container')
                .attr('contenteditable', App.user.is(this.user));
            PasteFilter(this.commentEl);

            this.setStatus(this.status, true);
        },

        setStatus: function (status, reset) {
            this.query('.inactive').setVisible(!status);
            this.query('.active').setVisible(!!status);

            if (status) {
                const icon = this.getIconForStatus(status);
                if (!icon) {
                    throw new Error('Unknown status: ' + status);
                }
                this.el.setAttribute('class', 'status-widget ' + icon.cls);
                this.el.classList.toggle('editable', App.user.is(this.user));

                if (status === 'active' && reset && App.user.is(this.user)) {
                    this.iconEl.setHtml(this.iconSet.map(buildIcon).join(''));
                    this.commentEl.setVisible(false);
                    this.iconEl.queryAll('span').on('click', this.handleStatusClick.bind(this));
                } else {
                    this.iconEl.setHtml(buildIcon(icon));
                    if (!this.comment || this.status !== status) {
                        this.commentEl.text(icon.label);
                        this.comment = icon.label;
                    }
                    if (this.status !== status) {
                        this.status = status;
                    }
                    this.commentEl.setVisible(true);
                    if (App.user.is(this.user)) {
                        this.iconEl.queryAll('span').on('click', this.handleStatusReset.bind(this));
                    }
                }
            }
        },

        getIconForStatus: function (status) {
            for (let i in this.iconSet) {
                const icon = this.iconSet[i];
                if (icon.name === status) {
                    return icon;
                }
            }
            return null;
        },



        handleStatusReset: function (event) {
            this.setStatus('active', true);
        },

        handleStatusClick: function (event) {
            this.setStatus(event.target.dataset.status);
        }
    };

    function StatusWidget(iconSet, user, status, comment) {
        const obj = Object.create(proto);
        obj.iconSet = iconSet;
        obj.user = user;
        obj.status = status;
        obj.comment = comment;

        obj.setHtml('text!partials/StatusWidget.html');
        return obj;
    }

    StatusWidget.IconSets = {
        ReviewOwner: [
            { name: 'active',       icon: 'fa-square-o',        label: 'Active',        cls: 'none' },
            { name: 'closed',       icon: 'fa-check-square',    label: 'Complete',      cls: 'gray' },
            { name: 'aborted',      icon: 'fa-minus-square',    label: 'Aborted',       cls: 'red' }
        ],
        Reviewer: [
            { name: 'active',       icon: 'fa-hourglass-o',     label: 'Reviewing',     cls: 'none' },
            { name: 'looksGood',    icon: 'fa-thumbs-o-up',     label: 'Looks Good',    cls: 'green' },
            { name: 'needsWork',    icon: 'fa-wrench',          label: 'Needs Work',    cls: 'yellow' },
            { name: 'hasIssues',    icon: 'fa-thumbs-o-down',   label: 'Has Issues',    cls: 'red' },
            { name: 'abstain',      icon: 'fa-ban',             label: 'Abstain',       cls: 'gray' }
        ]
    };

    return StatusWidget;
});
