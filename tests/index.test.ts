import { expectType } from 'tsd';

import { Lens, Iso } from 'monocle-ts';

import * as Union from '../src/index';

describe('packages', () => {
  describe('union', () => {
    describe('type', () => {
      it('return null because its only used to infer type at compile time', () => {
        expect(Union.type<never>()).toBeNull();
        expectType<never>(Union.type<never>());
      });
    });

    describe('of', () => {
      it('creates an union api given the corresponding types', () => {
        type One = { value: 'one' };
        type Two = { value: 'two' };

        const UnionAPI = Union.of({
          One: Union.type<One>(),
          Two: Union.type<Two>(),
        });

        expectType<Union.UnionAPIDef<{ One: One; Two: Two }, 'One' | 'Two'>>(
          UnionAPI,
        );

        expect(Object.keys(UnionAPI.types)).toEqual(['One', 'Two']);
      });
    });

    describe('merge', () => {
      it('merges two union API', () => {
        type One = { value: 'one' };
        type Two = { value: 'two' };

        const UnionAPI1 = Union.of({
          One: Union.type<One>(),
          Two: Union.type<Two>(),
        });

        type Three = { value: 'three' };

        const UnionAPI2 = Union.of({
          Three: Union.type<Three>(),
        });

        const Union3 = Union.merge(UnionAPI1, UnionAPI2);

        expectType<
          Union.UnionAPIDef<
            { One: One; Two: Two; Three: Three },
            'One' | 'Two' | 'Three'
          >
        >(Union3);

        expect(Object.keys(Union3.types)).toEqual(['One', 'Two', 'Three']);
      });
    });

    describe('omit', () => {
      it('omits a variance of an union', () => {
        type One = { value: 'one' };
        type Two = { value: 'two' };
        type Three = { value: 'three' };

        const UnionAPI1 = Union.of({
          One: Union.type<One>(),
          Two: Union.type<Two>(),
          Three: Union.type<Three>(),
        });

        const Union2 = Union.omit(UnionAPI1, ['Two']);

        expectType<
          Union.Of<
            Pick<
              {
                One: One;
                Two: Two;
                Three: Three;
              },
              'One' | 'Three'
            >,
            'One' | 'Three'
          >
        >(Union2.of);

        expect(Object.keys(Union2.types)).toEqual(['One', 'Three']);
      });

      it('omits multiple variance of an union', () => {
        type One = { value: 'one' };
        type Two = { value: 'two' };
        type Three = { value: 'three' };

        const UnionAPI1 = Union.of({
          One: Union.type<One>(),
          Two: Union.type<Two>(),
          Three: Union.type<Three>(),
        });

        const Union2 = Union.omit(UnionAPI1, ['Two', 'Three']);

        expectType<
          Union.Of<
            Pick<
              {
                One: One;
                Two: Two;
                Three: Three;
              },
              'One'
            >,
            'One'
          >
        >(Union2.of);

        expect(Object.keys(Union2.of)).toEqual(['One']);
      });
    });

    describe('pick', () => {
      it('picks a variance of an union', () => {
        type One = { value: 'one' };
        type Two = { value: 'two' };
        type Three = { value: 'three' };

        const UnionAPI1 = Union.of({
          One: Union.type<One>(),
          Two: Union.type<Two>(),
          Three: Union.type<Three>(),
        });

        const Union2 = Union.pick(UnionAPI1, ['Two']);

        expectType<
          Union.Of<
            Pick<
              {
                One: One;
                Two: Two;
                Three: Three;
              },
              'Two'
            >,
            'Two'
          >
        >(Union2.of);

        expect(Object.keys(Union2.types)).toEqual(['Two']);
      });

      it('picks multiple variance of an union', () => {
        type One = { value: 'one' };
        type Two = { value: 'two' };
        type Three = { value: 'three' };

        const UnionAPI1 = Union.of({
          One: Union.type<One>(),
          Two: Union.type<Two>(),
          Three: Union.type<Three>(),
        });

        const Union2 = Union.pick(UnionAPI1, ['Two', 'Three']);

        expectType<
          Union.Of<
            Pick<
              {
                One: One;
                Two: Two;
                Three: Three;
              },
              'Two' | 'Three'
            >,
            'Two' | 'Three'
          >
        >(Union2.of);

        expect(Object.keys(Union2.types)).toEqual(['Two', 'Three']);
      });
    });

    describe('union api', () => {
      type One = { value: 'one' };
      type Two = { value: 'two' };

      const UnionAPI = Union.of({
        One: Union.type<One>(),
        Two: Union.type<Two>(),
      });

      describe('of', () => {
        it('creates an opaque instance', () => {
          const one = UnionAPI.of.One({ value: 'one' });

          expectType<Union.Opaque<'One'>>(one);
          // eslint-disable-next-line no-underscore-dangle
          expect(one.__OPAQUE__).toEqual('__OPAQUE__');
          // eslint-disable-next-line no-underscore-dangle
          expect(one.__OPAQUE_KEY__).toEqual('One');
          expect(one.value).toEqual({ value: 'one' });
        });
      });

      describe('is', () => {
        it('is a type guard for any instance of the union', () => {
          const one = UnionAPI.of.One({ value: 'one' });
          const two = UnionAPI.of.Two({ value: 'two' });

          expect(UnionAPI.is(one)).toEqual(true);
          expect(UnionAPI.is(two)).toEqual(true);
          expect(UnionAPI.is(2)).toEqual(false);
        });

        it('exposes a type guard for each type', () => {
          const one = UnionAPI.of.One({ value: 'one' });
          const two = UnionAPI.of.Two({ value: 'two' });

          expect(UnionAPI.is.One(one)).toEqual(true);
          expect(UnionAPI.is.One(two)).toEqual(false);

          expect(UnionAPI.is.Two(one)).toEqual(false);
          expect(UnionAPI.is.Two(two)).toEqual(true);

          // eslint-disable-next-line @typescript-eslint/ban-ts-comment
          // @ts-expect-error
          expect(UnionAPI.is.One(2)).toEqual(false);
          // eslint-disable-next-line @typescript-eslint/ban-ts-comment
          // @ts-expect-error
          expect(UnionAPI.is.Two(2)).toEqual(false);
        });
      });

      describe('fold', () => {
        it('calls the corresponding function', () => {
          const one = UnionAPI.of.One({ value: 'one' });

          const result = UnionAPI.fold({
            One: () => 'one',
            Two: () => 'one',
          })(one);

          expect(result).toEqual('one');
        });
      });

      describe('iso', () => {
        it('exposes a monocle-ts iso', () => {
          expectType<
            Iso<
              Union.Opaque<'One'> | Union.Opaque<'Two'>,
              Union.Tagged<One, 'One'> | Union.Tagged<Two, 'Two'>
            >
          >(UnionAPI.iso);

          const one = UnionAPI.of.One({ value: 'one' });

          const $instance = UnionAPI.iso.get(one);

          expect($instance).toEqual({
            _tag: 'One',
            value: 'one',
          });

          const $instanceBis = {
            _tag: 'One',
            value: 'one',
          } as const;

          const oneBis = UnionAPI.iso.reverseGet($instanceBis);

          expect(oneBis).toEqual(one);
        });

        it('is present for each type', () => {
          expectType<Iso<Union.Opaque<'One'>, One>>(UnionAPI.One.iso);
          expectType<Iso<Union.Opaque<'Two'>, Two>>(UnionAPI.Two.iso);

          const one = UnionAPI.of.One({ value: 'one' });

          const $one = UnionAPI.One.iso.get(one);

          expect($one).toEqual({
            value: 'one',
          });
        });
      });

      describe('lensFromProp', () => {
        it('returns a monocle-ts Lens for the corresponding prop', () => {
          const lens = UnionAPI.lensFromProp('value');

          expectType<
            Lens<Union.Opaque<'One'> | Union.Opaque<'Two'>, 'one' | 'two'>
          >(lens);

          const one = UnionAPI.of.One({ value: 'one' });
          const value = lens.get(one);

          expect(value).toEqual('one');
        });

        it('is present for each type', () => {
          const lensOne = UnionAPI.One.lensFromProp('value');
          expectType<Lens<Union.Opaque<'One'>, 'one'>>(lensOne);

          const lensTwo = UnionAPI.Two.lensFromProp('value');
          expectType<Lens<Union.Opaque<'Two'>, 'two'>>(lensTwo);

          const one = UnionAPI.of.One({ value: 'one' });
          const value = lensOne.get(one);

          expect(value).toEqual('one');
        });
      });
    });
  });
});
