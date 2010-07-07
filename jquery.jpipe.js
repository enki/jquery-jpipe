(function($) { // hide the namespace
    // make sure logging doesn't raise
    try { console = console || {};} catch (e) {}
    try { console.log = console.log || function(what){}; } catch (e) {}

    $.jpipe = {
        version: '0.1',
        subscriptions: {},
        startable: true,
        iterval: 600,
        
        subscribe: function(args) {
            args.last_response_time = 0;
            if (!args.callcnt) {
                args.callcnt = 0;
            }
            if (!args.serverclock) {
                args.serverclock = 0;
            }
            args.url = '/queue/';
            args.patience = 6000;
            
            console.log( $.format("Subscribing to {queue}.", args) );
            if (this.subscriptions[args.queue]) {
                console.log('already subscribed');
            } else {
                this.subscriptions[args.queue] = args;
            }
        },
        unsubscribe: function(args) {
            console.log( $.format("Unsubscribing from {queue}.", args) );
            this.subscriptions[args.queue] = null;
        },
        publish: function(args) {
            console.log( $.format("Subscribing to {queue}.", args) );
            // queue = this.subscriptions[args.queue]; // not needed
        },
        xhrcallback: function(data) {
            localqueue = $.jpipe.subscriptions[data.queue.queue];
            if (data.queue.callcnt < localqueue.callcnt) {
                console.log('old xhr' + data.queue.callcnt + '/' + localqueue.callcnt + 
                            'returned.');
                // console.log('ignoring.');
                // return;
            }
            console.log('xhr' + data.queue.callcnt + '/' + localqueue.callcnt + ' returned');
            var d = new Date();
            var now = d.valueOf();
            localqueue.last_response_time = now;
            
            $.jpipe.poll(localqueue);
            
            console.log(data);
            
            if (data.queue.message) {
                localqueue.cb(data.queue.message);
            }
        },
        poll: function(args) {
            args.callcnt += 1;
            console.log('polling ' + args.callcnt);
            var url = $.format('{url}?callback=?&data={params}', {
                url: args.url,
                params: $.json.encode({
                        version: $.jpipe.version,
                        queue: args
                    })
            });
            
            // $.getJSON(url, {}, $.jpipe.xhrcallback);
            $.jsonp({
                url: url,
                success: $.jpipe.xhrcallback
            });
            var d = new Date();
            var now = d.valueOf();

            args.last_response_time = now;
        },
        loop: function() {
            if (this.startable) {
                this.startable = false;
                // this._iter();
                setTimeout($.jpipe._iter, 600);
            }
        },
        _iter: function() {
            setTimeout($.jpipe._iter, 600);
            $.each($.jpipe.subscriptions, function(key, queue){
                var d = new Date();
                var now = d.valueOf();
                var age = now - queue.last_response_time;
                // console.log(age);
                if (age > queue.patience) {
                    console.log('impatient! ' + age);
                    $.jpipe.poll(queue);
                }
            });
        },
    lastcomma:null};
})(jQuery);