import {
  App,
  ContainerElement,
  CssClassBasedActivableElement,
  CssClassBasedSelectableElement,
  ElementLocator,
  FileMatcher,
  ImageElement,
  InputFormControl,
  RadioFormControl,
  Router,
  StringMatcher,
  TextElement,
  UrlMatcher,
  altSelector,
  cssSelector,
  exactCaseInsensitiveRegexp,
  it,
} from '@lowgular/testgular';
import { test } from '@playwright/test';

const APP_CONFIG = {
  appUrl: 'https://www.esky.pl',
  routes: {},
  module: {},
};

test.describe('home page', () => {
  it(`route`, APP_CONFIG, async (app: App) => {
    const router = app.inject(Router);
    await router.navigateAndWait('/');

    await router.expectUrl('/');
  });

  it(`privacy policy modal`, APP_CONFIG, async (app: App) => {
    const router = app.inject(Router);
    const el = app.inject(ElementLocator);
    await router.navigateAndWait('/');

    const title = el.locateChild(TextElement, 'uc-heading-title');
    const privacyPolicyButton = el.locateChild(
      CssClassBasedSelectableElement,
      'uc-anchor-link'
    );
    const acceptAllButton = el.locateChild(
      CssClassBasedActivableElement,
      'uc-accept-all-button'
    );

    await privacyPolicyButton.expectContent(
      new RegExp('polityka prywatności', 'i')
    );

    await privacyPolicyButton.expectAttribute('target', '_blank');
    await title.expectContent(new RegExp('chronimy twoje dane osobowe', 'i'));
    await acceptAllButton.expectContent(new RegExp(/.*(?:zgadzam się).*/i));
  });

  it(`accordion`, APP_CONFIG, async (app: App) => {
    const router = app.inject(Router);
    const el = app.inject(ElementLocator);
    await router.navigateAndWait('/');

    const accordion = el.locateList(
      ContainerElement,
      cssSelector('.sc-dPZUQH')
    );

    await accordion.expectToHaveLength(8888);
  });

  it(`search tabs`, APP_CONFIG, async (app: App) => {
    const router = app.inject(Router);
    const el = app.inject(ElementLocator);
    await router.navigateAndWait('/');
    const acceptAllButton = el.locateChild(
      CssClassBasedActivableElement,
      'uc-accept-all-button'
    );

    const expectedData = [
      { label: 'Loty', icon: 'plane_right' },
      { label: 'Lot', icon: 'packages_wide' },
      { label: 'City Break', icon: 'eiffel_tower' },
      { label: 'Wakacje', icon: 'beach' },
      { label: 'Noclegi', icon: 'hotel' },
      { label: 'Samochody', icon: 'car' },
      { label: 'Ubezpieczenia', icon: 'umbrella_big' },
    ];

    await acceptAllButton.click();

    const tabs = el.locateList(ContainerElement, cssSelector('.mq-tab'));
    await tabs.expectToHaveLength(expectedData.length);

    await tabs.forEachChild(async (tab, index) => {
      const span = tab.elementLocator.locateChild(
        TextElement,
        cssSelector('.mq-tab-caption')
      );
      const img = tab.elementLocator.locateChild(
        ImageElement,
        altSelector(expectedData[index].label)
      );

      await img.expectContent(
        exactCaseInsensitiveRegexp(
          UrlMatcher.startsWith(
            `https://www.esky.pl/_fe/img/icon_${expectedData[index].icon}`,
            FileMatcher.fileName(FileMatcher.anyExtension)
          )
        )
      );

      await span.expectContent(
        StringMatcher.mustContainWords([expectedData[index].label])
      );
    });

    const firstTab = await tabs.getNthElement(0);
    await firstTab.expectAttribute(
      'class',
      StringMatcher.mustContainWords(['active'])
    );
  });

  it(`flight types radio group`, APP_CONFIG, async (app: App) => {
    const router = app.inject(Router);
    const el = app.inject(ElementLocator);
    await router.navigateAndWait('/');
    const acceptAllButton = el.locateChild(
      CssClassBasedActivableElement,
      'uc-accept-all-button'
    );

    await acceptAllButton.click();

    const expectedData = [
      { value: 'RoundTrip', isInitiallyChecked: true },
      { value: 'OneWay', isInitiallyChecked: false },
      { value: 'MultiCity', isInitiallyChecked: false },
    ];

    const radioGroup = el.locateList(ContainerElement, cssSelector('li.type'));
    await radioGroup.expectToHaveLength(3);

    await radioGroup.forEachChild(async (radio, index) => {
      const flightType = radio.elementLocator.locateChild(
        RadioFormControl,
        cssSelector('input[type="radio"]')
      );

      await flightType.expectValue(expectedData[index].value);
      await flightType.expectChecked(expectedData[index].isInitiallyChecked);
      await flightType.check();
      await flightType.expectChecked(true);
    });
  });

  [
    {
      id: 'departureRoundtrip0',
      value: 'Warszawa',
    },
    {
      id: 'arrivalRoundtrip0',
      value: 'Berlin',
    },
  ].forEach(({ id, value }, i) =>
    it(`search form cities - #${i}`, APP_CONFIG, async (app: App) => {
      const router = app.inject(Router);
      const el = app.inject(ElementLocator);
      await router.navigateAndWait('/');
      const acceptAllButton = el.locateChild(
        CssClassBasedActivableElement,
        'uc-accept-all-button'
      );

      await acceptAllButton.click();

      const search = el.locateChild(
        ContainerElement,
        cssSelector('form.flights-qsf')
      );

      const input = search.elementLocator.locateChild(
        InputFormControl,
        cssSelector(`#${id}`)
      );
      await input.expectEmpty();
      await input.expectAttribute('required', 'required');
      await input.setValue(value);
      await input.expectValue(value);
    })
  );
});
