'use strict';

/* https://github.com/angular/protractor/blob/master/docs/toc.md */

describe('my app', function() {


  it('should automatically redirect to /customizer when location hash/fragment is empty', function() {
    browser.get('index.html');
    expect(browser.getLocationAbsUrl()).toMatch("/customizer");
  });


  describe('view1', function() {

    beforeEach(function() {
      browser.get('index.html#/customizer');
    });


    it('should render customizer when user navigates to /customizer', function() {
      expect(element.all(by.css('[ng-home] p')).first().getText()).
        toMatch(/partial for view 1/);
    });

  });


  describe('view2', function() {

    beforeEach(function() {
      browser.get('index.html#/home');
    });


    it('should render home when user navigates to /home', function() {
      expect(element.all(by.css('[ng-home] p')).first().getText()).
        toMatch(/partial for view 2/);
    });

  });
});
