'use strict';

var applicationUtils = require('../../../app/scripts/modules/injected/applicationUtils.js');

var basicMock = {
    commonInformation: {
        frameworkName: 'OpenUI5',
        version: '1.28.16',
        buildTime: '201508171459',
        userAgent: 'Mozilla/5.0 (Windows NT 6.3; WOW64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/44.0.2403.157 Safari/537.36',
        applicationHREF: 'https://openui5.hana.ondemand.com/explored.html',
        documentTitle: 'OpenUI5 Explored',
        documentMode: '',
        debugMode: false,
        statistics: true
    },
    configurationBootstrap: {
        resourceroots: {
            '': 'resources/',
            'sap.ui.demo.mock': 'test-resources/sap/ui/demokit/explored/'
        },
        themeroots: {},
        'xx-loadallmode': false,
        theme: 'sap_bluecrystal',
        preload: 'async',
        libs: 'sap.m, sap.ui.layout, sap.ui.demokit',
        bindingsyntax: 'complex',
        compatversion: '1.16'
    },
    configurationComputed: {
        theme: 'sap_bluecrystal',
        language: 'en-US',
        formatLocale: 'en-US',
        accessibility: true,
        animation: true,
        rtl: false,
        debug: false,
        inspect: false,
        originInfo: false,
        noDuplicateIds: true
    },
    libraries: {
        'sap.ui.core': '1.28.16',
        'sap.m': '1.28.16',
        'sap.ui.commons': '1.28.16',
        'sap.ui.demokit': '1.28.16',
        'sap.ui.layout': '1.28.16',
        'sap.ui.suite': '1.28.16',
        'sap.ui.table': '1.28.16',
        'sap.ui.unified': '1.28.16',
        'sap.ui.ux3': '1.28.16',
        'themelib_sap_bluecrystal': '1.28.16',
        'themelib_sap_goldreflection': '1.28.16'
    },
    loadedLibraries: {
        'sap.ui.core': '1.28.16',
        'sap.m': '1.28.16',
        'sap.ui.layout': '1.28.16',
        'sap.ui.commons': '1.28.16',
        'sap.ui.demokit': '1.28.16'
    },
    loadedModules: ['ToolsAPI', 'jquery.sap.act'],
    URLParameters: {'sap-ui-language': ['en-US', 'bg-BG']}
};

var fullMock = {
    commonInformation: {
        frameworkName: 'OpenUI5',
        version: '1.28.16',
        buildTime: '201508171459',
        userAgent: 'Mozilla/5.0 (Windows NT 6.3; WOW64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/44.0.2403.157 Safari/537.36',
        applicationHREF: 'https://openui5.hana.ondemand.com/explored.html',
        documentTitle: 'OpenUI5 Explored',
        documentMode: '',
        debugMode: false,
        statistics: true
    },
    configurationBootstrap: {
        resourceroots: {
            '': 'resources/',
            'sap.ui.demo.mock': 'test-resources/sap/ui/demokit/explored/'
        },
        themeroots: {},
        'xx-loadallmode': false,
        theme: 'sap_bluecrystal',
        preload: 'async',
        libs: 'sap.m, sap.ui.layout, sap.ui.demokit',
        bindingsyntax: 'complex',
        compatversion: '1.16'
    },
    configurationComputed: {
        theme: 'sap_bluecrystal',
        language: 'en-US',
        formatLocale: 'en-US',
        accessibility: true,
        animation: true,
        rtl: false,
        debug: false,
        inspect: false,
        originInfo: false,
        noDuplicateIds: true
    },
    libraries: {
        'sap.ui.core': '1.28.16',
        'sap.m': '1.28.16',
        'sap.ui.commons': '1.28.16',
        'sap.ui.demokit': '1.28.16',
        'sap.ui.layout': '1.28.16',
        'sap.ui.suite': '1.28.16',
        'sap.ui.table': '1.28.16',
        'sap.ui.unified': '1.28.16',
        'sap.ui.ux3': '1.28.16',
        'themelib_sap_bluecrystal': '1.28.16',
        'themelib_sap_goldreflection': '1.28.16'
    },
    loadedLibraries: {
        'sap.ui.core': '1.28.16',
        'sap.m': '1.28.16',
        'sap.ui.layout': '1.28.16',
        'sap.ui.commons': '1.28.16',
        'sap.ui.demokit': '1.28.16'
    },
    loadedModules: ['ToolsAPI', 'jquery.sap.act', 'jquery.sap.dom', 'jquery.sap.encoder', 'jquery.sap.events', 'jquery.sap.global', 'jquery.sap.keycodes', 'jquery.sap.mobile', 'jquery.sap.promise', 'jquery.sap.properties', 'jquery.sap.resources', 'jquery.sap.script', 'jquery.sap.sjax', 'jquery.sap.storage', 'jquery.sap.strings', 'jquery.sap.ui', 'jquery.sap.xml', 'sap-ui-core', 'sap.m.BackgroundDesign', 'sap.m.Bar', 'sap.m.BarDesign', 'sap.m.BarInPageEnabler', 'sap.m.BarRenderer', 'sap.m.Button', 'sap.m.ButtonRenderer', 'sap.m.ButtonType', 'sap.m.DateTimeInputType', 'sap.m.DialogType', 'sap.m.FacetFilterListDataType', 'sap.m.FacetFilterType', 'sap.m.FlexAlignItems', 'sap.m.FlexAlignSelf', 'sap.m.FlexDirection', 'sap.m.FlexJustifyContent', 'sap.m.FlexRendertype', 'sap.m.GroupHeaderListItem', 'sap.m.GroupHeaderListItemRenderer', 'sap.m.HeaderLevel', 'sap.m.IBarHTMLTag', 'sap.m.IconTabFilterDesign', 'sap.m.InputType', 'sap.m.InstanceManager', 'sap.m.Label', 'sap.m.LabelDesign', 'sap.m.List', 'sap.m.ListBase', 'sap.m.ListBaseRenderer', 'sap.m.ListHeaderDesign', 'sap.m.ListItemBase', 'sap.m.ListItemBaseRenderer', 'sap.m.ListMode', 'sap.m.ListRenderer', 'sap.m.ListSeparators', 'sap.m.ListType', 'sap.m.NavContainer', 'sap.m.NavContainerRenderer', 'sap.m.P13nPanelType', 'sap.m.Page', 'sap.m.PageBackgroundDesign', 'sap.m.PageRenderer', 'sap.m.PlacementType', 'sap.m.PopinDisplay', 'sap.m.Popover', 'sap.m.QuickViewGroupElementType', 'sap.m.RatingIndicatorVisualMode', 'sap.m.ScreenSize', 'sap.m.SearchField', 'sap.m.SearchFieldRenderer', 'sap.m.SelectType', 'sap.m.Shell', 'sap.m.ShellRenderer', 'sap.m.SplitApp', 'sap.m.SplitAppMode', 'sap.m.SplitAppRenderer', 'sap.m.SplitContainer', 'sap.m.SplitContainerRenderer', 'sap.m.StandardListItem', 'sap.m.StandardListItemRenderer', 'sap.m.StandardTileType', 'sap.m.Support', 'sap.m.SwipeDirection', 'sap.m.SwitchType', 'sap.m.Title', 'sap.m.TitleRenderer', 'sap.m.Toolbar', 'sap.m.ToolbarDesign', 'sap.m.ToolbarLayoutData', 'sap.m.ToolbarRenderer', 'sap.m.ToolbarSpacer', 'sap.m.ToolbarSpacerRenderer', 'sap.m.VerticalPlacementType', 'sap.m.library', 'sap.m.routing.RouteMatchedHandler', 'sap.m.routing.TargetHandler', 'sap.ui.Device', 'sap.ui.Global', 'sap.ui.base.BindingParser', 'sap.ui.base.DataType', 'sap.ui.base.Event', 'sap.ui.base.EventProvider', 'sap.ui.base.Exception', 'sap.ui.base.ExpressionParser', 'sap.ui.base.Interface', 'sap.ui.base.ManagedObject', 'sap.ui.base.ManagedObjectMetadata', 'sap.ui.base.Metadata', 'sap.ui.base.Object', 'sap.ui.base.ObjectPool', 'sap.ui.commons.ButtonStyle', 'sap.ui.commons.HorizontalDividerHeight', 'sap.ui.commons.HorizontalDividerType', 'sap.ui.commons.LabelDesign', 'sap.ui.commons.MenuBarDesign', 'sap.ui.commons.MessageType', 'sap.ui.commons.PaginatorEvent', 'sap.ui.commons.RatingIndicatorVisualMode', 'sap.ui.commons.RowRepeaterDesign', 'sap.ui.commons.SplitterSize', 'sap.ui.commons.TextViewColor', 'sap.ui.commons.TextViewDesign', 'sap.ui.commons.TitleLevel', 'sap.ui.commons.ToolbarDesign', 'sap.ui.commons.ToolbarSeparatorDesign', 'sap.ui.commons.TreeSelectionMode', 'sap.ui.commons.TriStateCheckBoxState', 'sap.ui.commons.enums.AreaDesign', 'sap.ui.commons.enums.BorderDesign', 'sap.ui.commons.enums.Orientation', 'sap.ui.commons.form.GridElementCells', 'sap.ui.commons.form.SimpleFormLayout', 'sap.ui.commons.layout.BackgroundDesign', 'sap.ui.commons.layout.BorderLayoutAreaTypes', 'sap.ui.commons.layout.HAlign', 'sap.ui.commons.layout.Padding', 'sap.ui.commons.layout.Separation', 'sap.ui.commons.layout.VAlign', 'sap.ui.commons.library', 'sap.ui.core.AccessibleRole', 'sap.ui.core.BarColor', 'sap.ui.core.CSSColor', 'sap.ui.core.CSSSize', 'sap.ui.core.CSSSizeShortHand', 'sap.ui.core.CalendarType', 'sap.ui.core.Collision', 'sap.ui.core.Component', 'sap.ui.core.ComponentContainer', 'sap.ui.core.ComponentContainerRenderer', 'sap.ui.core.ComponentMetadata', 'sap.ui.core.Configuration', 'sap.ui.core.Control', 'sap.ui.core.Core', 'sap.ui.core.CustomData', 'sap.ui.core.CustomStyleClassSupport', 'sap.ui.core.DeclarativeSupport', 'sap.ui.core.Design', 'sap.ui.core.Dock', 'sap.ui.core.Element', 'sap.ui.core.ElementMetadata', 'sap.ui.core.EnabledPropagator', 'sap.ui.core.EventBus', 'sap.ui.core.ExtensionPoint', 'sap.ui.core.FocusHandler', 'sap.ui.core.HTML', 'sap.ui.core.HorizontalAlign', 'sap.ui.core.ID', 'sap.ui.core.Icon', 'sap.ui.core.IconColor', 'sap.ui.core.IconPool', 'sap.ui.core.IconRenderer', 'sap.ui.core.ImeMode', 'sap.ui.core.IntervalTrigger', 'sap.ui.core.InvisibleText', 'sap.ui.core.LabelEnablement', 'sap.ui.core.LayoutData', 'sap.ui.core.Locale', 'sap.ui.core.MessageType', 'sap.ui.core.OpenState', 'sap.ui.core.Orientation', 'sap.ui.core.Percentage', 'sap.ui.core.Popup', 'sap.ui.core.PopupSupport', 'sap.ui.core.RenderManager', 'sap.ui.core.Renderer', 'sap.ui.core.ResizeHandler', 'sap.ui.core.ScrollBarAction', 'sap.ui.core.Scrolling', 'sap.ui.core.TextAlign', 'sap.ui.core.TextDirection', 'sap.ui.core.ThemeCheck', 'sap.ui.core.TitleLevel', 'sap.ui.core.UIArea', 'sap.ui.core.UIComponent', 'sap.ui.core.UIComponentMetadata', 'sap.ui.core.URI', 'sap.ui.core.ValueState', 'sap.ui.core.VerticalAlign', 'sap.ui.core.Wrapping', 'sap.ui.core.XMLTemplateProcessor', 'sap.ui.core.delegate.ItemNavigation', 'sap.ui.core.delegate.ScrollEnablement', 'sap.ui.core.library', 'sap.ui.core.message.ControlMessageProcessor', 'sap.ui.core.message.Message', 'sap.ui.core.message.MessageManager', 'sap.ui.core.message.MessageProcessor', 'sap.ui.core.mvc.Controller', 'sap.ui.core.mvc.HTMLView', 'sap.ui.core.mvc.HTMLViewRenderer', 'sap.ui.core.mvc.JSView', 'sap.ui.core.mvc.JSViewRenderer', 'sap.ui.core.mvc.View', 'sap.ui.core.mvc.ViewRenderer', 'sap.ui.core.mvc.ViewType', 'sap.ui.core.mvc.XMLView', 'sap.ui.core.mvc.XMLViewRenderer', 'sap.ui.core.routing.HashChanger', 'sap.ui.core.routing.History', 'sap.ui.core.routing.HistoryDirection', 'sap.ui.core.routing.Route', 'sap.ui.core.routing.Router', 'sap.ui.core.routing.Target', 'sap.ui.core.routing.Targets', 'sap.ui.core.routing.Views', 'sap.ui.core.theming.Parameters', 'sap.ui.core.tmpl.Template', 'sap.ui.core.util.LibraryInfo', 'sap.ui.core.util.UnicodeNormalizer', 'sap.ui.demokit.UI5EntityCueCardStyle', 'sap.ui.demokit.explored.Bootstrap', 'sap.ui.demokit.explored.Component', 'sap.ui.demokit.explored.util.MyRouter', 'sap.ui.demokit.explored.util.ObjectSearch', 'sap.ui.demokit.explored.util.ToggleFullScreenHandler', 'sap.ui.demokit.explored.view.app.controller', 'sap.ui.demokit.explored.view.app.view', 'sap.ui.demokit.explored.view.master.controller', 'sap.ui.demokit.js.highlight-query-terms', 'sap.ui.demokit.library', 'sap.ui.layout.GridIndent', 'sap.ui.layout.GridPosition', 'sap.ui.layout.GridSpan', 'sap.ui.layout.form.GridElementCells', 'sap.ui.layout.form.SimpleFormLayout', 'sap.ui.layout.library', 'sap.ui.model.Binding', 'sap.ui.model.BindingMode', 'sap.ui.model.ChangeReason', 'sap.ui.model.ClientContextBinding', 'sap.ui.model.ClientListBinding', 'sap.ui.model.ClientModel', 'sap.ui.model.ClientPropertyBinding', 'sap.ui.model.ClientTreeBinding', 'sap.ui.model.CompositeBinding', 'sap.ui.model.CompositeType', 'sap.ui.model.Context', 'sap.ui.model.ContextBinding', 'sap.ui.model.Filter', 'sap.ui.model.FilterOperator', 'sap.ui.model.FilterProcessor', 'sap.ui.model.FilterType', 'sap.ui.model.FormatException', 'sap.ui.model.ListBinding', 'sap.ui.model.Model', 'sap.ui.model.ParseException', 'sap.ui.model.PropertyBinding', 'sap.ui.model.SimpleType', 'sap.ui.model.Sorter', 'sap.ui.model.SorterProcessor', 'sap.ui.model.TreeBinding', 'sap.ui.model.Type', 'sap.ui.model.ValidateException', 'sap.ui.model.json.JSONListBinding', 'sap.ui.model.json.JSONModel', 'sap.ui.model.json.JSONPropertyBinding', 'sap.ui.model.json.JSONTreeBinding', 'sap.ui.model.message.MessageListBinding', 'sap.ui.model.message.MessageModel', 'sap.ui.model.message.MessagePropertyBinding', 'sap.ui.model.resource.ResourceModel', 'sap.ui.model.resource.ResourcePropertyBinding', 'sap.ui.thirdparty.URI', 'sap.ui.thirdparty.crossroads', 'sap.ui.thirdparty.hasher', 'sap.ui.thirdparty.jquery-mobile-custom', 'sap.ui.thirdparty.jquery.jquery-1.11.1', 'sap.ui.thirdparty.jqueryui.jquery-ui-position', 'sap.ui.thirdparty.signals'],
    URLParameters: {}
};

describe('applicationUtils', function () {
    describe('should', function () {
        it('exists', function () {
            applicationUtils.should.be.a('object');
        });

        it('has #getApplicationInfo()', function () {
            applicationUtils.getApplicationInfo.should.be.a('function');
        });

        it('has #getInformationForPopUp()', function () {
            applicationUtils.getInformationForPopUp.should.be.a('function');
        });
    });

    describe('#getApplicationInfo()', function () {
        describe('should create an object for the DataView', function () {
            var applicationInformation = applicationUtils.getApplicationInfo(basicMock);

            it('with the common information for the framework', function () {
                var commonInformation = applicationInformation.common.data;
                var commonInformationWithLastBuildProperty = applicationUtils.getApplicationInfo(fullMock).common.data;

                commonInformation.OpenUI5.should.be.equal('1.28.16 (built at 2015/08/17 14:59h)');
                commonInformationWithLastBuildProperty.OpenUI5.should.be.equal('1.28.16 (built at 2015/08/17 14:59h)');
                commonInformation['User Agent'].should.be.equal(basicMock.commonInformation.userAgent);
                commonInformation.Application.should.be.equal(basicMock.commonInformation.applicationHREF);
            });

            it('with the bootstrap configuration information for the framework', function () {
                var configurationBootstrap = applicationInformation.configurationBootstrap.data;
                var mockConfigurationBootstrap = basicMock.configurationBootstrap;

                configurationBootstrap.resourceroots.should.equal('{"":"resources/","sap.ui.demo.mock":"test-resources/sap/ui/demokit/explored/"}');
                configurationBootstrap.themeroots.should.equal('{}');
                configurationBootstrap.theme.should.equal(mockConfigurationBootstrap.theme);
                configurationBootstrap.preload.should.equal(mockConfigurationBootstrap.preload);
                configurationBootstrap.libs.should.equal(mockConfigurationBootstrap.libs);
                configurationBootstrap.bindingsyntax.should.equal(mockConfigurationBootstrap.bindingsyntax);
                configurationBootstrap.compatversion.should.equal(mockConfigurationBootstrap.compatversion);
            });

            it('with the loaded modules from the framework', function () {
                var loadedModulesResult = applicationInformation.loadedModules.data;

                loadedModulesResult[1].should.be.equal('ToolsAPI');
                loadedModulesResult[2].should.be.equal('jquery.sap.act');
            });

            it('with the URL parameters that are used in the curent inspected page', function () {
                var loadedModulesResult = applicationInformation.urlParameters.data;

                loadedModulesResult['sap-ui-language'].should.be.equal('en-US, bg-BG');
            });

            it('with the computed configuration for the inspected page', function () {
                var configurationComputed = JSON.stringify(applicationInformation.configurationComputed.data);

                configurationComputed.should.be.equal(JSON.stringify(basicMock.configurationComputed));
            });

            it('with the loaded libraries from the framework', function () {
                var loadedLibraries = JSON.stringify(applicationInformation.loadedLibraries.data);

                loadedLibraries.should.be.equal(JSON.stringify(basicMock.loadedLibraries));
            });

            it('with the libraries from the framework', function () {
                var libraries = JSON.stringify(applicationInformation.libraries.data);

                libraries.should.be.equal(JSON.stringify(basicMock.libraries));
            });
        });
    });

    describe('#getInformationForPopUp()', function () {
        it('should create an object with the common information for the framework', function () {
            var commonInformation = applicationUtils.getInformationForPopUp(fullMock);

            commonInformation.OpenUI5.should.be.equal('1.28.16 (built at 2015/08/17 14:59h)');
        });
    });
});
