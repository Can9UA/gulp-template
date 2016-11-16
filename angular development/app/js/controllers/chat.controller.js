(function() {
  'use strict';

  angular.module('chatApp')
         .controller('chatCtrl', chatCtrl);

  chatCtrl.$inject = ['ChatService'];

  /* @ngInject */
  function chatCtrl(ChatService) {
    /* jshint validthis: true */
    var vm = this;

    vm.title = 'chatCtrl';
    vm.scrollBottom = scrollBottom;

    // vm.messages = ChatService.getMessages();

    ////////////////

    function scrollBottom() {
    }

  }
})();