define(['queryStringParameters'], function (queryStringParameters) {
        var context = {
        initialize: initialize,
        getCurrentUser: getCurrentUser,
        user: new UserContext(),
        clear: clear,
		use: use
    };

    return context;

    function UserContext() {
        this.email = null;
        this.username = null;
		this.account = null;
    }

    function getCurrentUser() {
        return context.user.email && context.user.username ? context.user : null;
    }

    function clear() {
        context.user = new UserContext();
    }
	
    function use(userInfoProvider) {
        if(!userInfoProvider) {
            return;
        }
        var accountId = userInfoProvider.getAccountId(),
            accountHomePage = userInfoProvider.getAccountHomePage(),
            username = userInfoProvider.getUsername();
        if(!accountId || !accountHomePage || !username) {
            return;
        }
		
		context.user.username = username;
        context.user.email = accountId;
        context.user.account = {
                homePage: accountHomePage,
                name: accountId
        };
    }

    function initialize() {
        return Q.fcall(function () {
            var username = queryStringParameters.get('name'),
                email = queryStringParameters.get('email');

            if (username || email) {
                context.user.username = username;
                context.user.email = email;
            }
        });
    }
});