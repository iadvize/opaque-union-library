import { expectType } from 'tsd';

import { Lens, Iso } from 'monocle-ts';

import * as Union from '../src/index';

describe('packages', () => {
  describe('union', () => {
    describe('of', () => {
      it('creates an union api given the corresponding types', () => {
        type One = { value: 'one' };
        type Two = { value: 'two' };

        const UnionAPI = Union.of({
          One: Union.type<One>(),
          Two: Union.type<Two>(),
        });

        expectType<
          Union.UnionAPIDef<
            'One' | 'Two',
            'default',
            { One: { default: One }; Two: { default: Two } }
          >
        >(UnionAPI);

        expect(Object.keys(UnionAPI.types)).toEqual(['One', 'Two']);
      });

      it('creates an union api with variation given the corresponding types', () => {
        type One1 = { value: 'one' };
        type One2 = { value: 'onebis' };
        type Two1 = { value: 'two' };
        type Two2 = { value: 'twobis' };

        const UnionAPI = Union.ofVariations({
          One: {
            var1: Union.type<One1>(),
            var2: Union.type<One2>(),
          },
          Two: {
            var1: Union.type<Two1>(),
            var2: Union.type<Two2>(),
          },
        });

        expectType<
          Union.UnionAPIDef<
            'One' | 'Two',
            'var1' | 'var2',
            {
              One: {
                var1: One1;
                var2: One2;
              };
              Two: {
                var1: Two1;
                var2: Two2;
              };
            }
          >
        >(UnionAPI);

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
            'One' | 'Two' | 'Three',
            'default',
            {
              One: { default: One };
              Two: { default: Two };
              Three: { default: Three };
            }
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
          Union.UnionAPIDef<
            'One' | 'Three',
            'default',
            { One: { default: One }; Three: { default: Three } }
          >
        >(Union2);

        expect(Object.keys(Union2.types)).toEqual(['One', 'Three']);
      });

      it('omits multiple types of an union', () => {
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
          Union.UnionAPIDef<'One', 'default', { One: { default: One } }>
        >(Union2);
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
          Union.UnionAPIDef<'Two', 'default', { Two: { default: Two } }>
        >(Union2);

        expect(Object.keys(Union2.types)).toEqual(['Two']);
      });

      it('picks multiple types of an union', () => {
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
          Union.UnionAPIDef<
            'Two' | 'Three',
            'default',
            { Two: { default: Two }; Three: { default: Three } }
          >
        >(Union2);

        expect(Object.keys(Union2.types)).toEqual(['Two', 'Three']);
      });
    });

    describe('union api', () => {
      type One = { value: 'one' };
      type Two = { value: 'two' };

      const UnionAPI = Union.ofVariations({
        One: {
          var1: Union.type<One>(),
          var2: Union.type<One>(),
        },
        Two: {
          var1: Union.type<Two>(),
          var2: Union.type<Two>(),
        },
      });

      const SimpleUnionAPI = Union.of({
        One: Union.type<One>(),
        Two: Union.type<Two>(),
      });

      type UnionType = Union.Type<typeof UnionAPI>;

      const UnionAPIVar1 = Union.omitVariations(UnionAPI, ['var2']);
      type UnionTypeVar1 = Union.Type<typeof UnionAPIVar1>;

      const UnionAPIVar2 = Union.omitVariations(UnionAPI, ['var1']);

      const UnionAPIOne = Union.pick(UnionAPI, ['One']);

      describe('of', () => {
        it('is a global function', () => {
          const one = UnionAPIVar1.of('One', 'var1', { value: 'one' });

          expectType<Union.Opaque<'One', 'var1'>>(one);

          // eslint-disable-next-line no-underscore-dangle
          expect(one.__OPAQUE__).toEqual('__OPAQUE__');

          // eslint-disable-next-line no-underscore-dangle
          expect(one.__OPAQUE_KEY__).toEqual('One');

          // eslint-disable-next-line no-underscore-dangle
          expect(one.__OPAQUE_VARIATION__).toEqual('var1');
        });

        it('is a function on each type', () => {
          const one = UnionAPIVar1.of.One('var1', { value: 'one' });

          expectType<Union.Opaque<'One', 'var1'>>(one);

          // eslint-disable-next-line no-underscore-dangle
          expect(one.__OPAQUE__).toEqual('__OPAQUE__');

          // eslint-disable-next-line no-underscore-dangle
          expect(one.__OPAQUE_KEY__).toEqual('One');

          // eslint-disable-next-line no-underscore-dangle
          expect(one.__OPAQUE_VARIATION__).toEqual('var1');
        });

        it('is a function on each type then variation', () => {
          const one = UnionAPIVar1.of.One.var1({ value: 'one' });

          expectType<Union.Opaque<'One', 'var1'>>(one);

          // eslint-disable-next-line no-underscore-dangle
          expect(one.__OPAQUE__).toEqual('__OPAQUE__');

          // eslint-disable-next-line no-underscore-dangle
          expect(one.__OPAQUE_KEY__).toEqual('One');

          // eslint-disable-next-line no-underscore-dangle
          expect(one.__OPAQUE_VARIATION__).toEqual('var1');
        });

        it('is a function on each variation', () => {
          const one = UnionAPIVar1.of.var1('One', { value: 'one' });

          expectType<Union.Opaque<'One', 'var1'>>(one);

          // eslint-disable-next-line no-underscore-dangle
          expect(one.__OPAQUE__).toEqual('__OPAQUE__');

          // eslint-disable-next-line no-underscore-dangle
          expect(one.__OPAQUE_KEY__).toEqual('One');

          // eslint-disable-next-line no-underscore-dangle
          expect(one.__OPAQUE_VARIATION__).toEqual('var1');
        });

        it('is a function on each variation then type', () => {
          const one = UnionAPIVar1.of.var1.One({ value: 'one' });

          expectType<Union.Opaque<'One', 'var1'>>(one);

          // eslint-disable-next-line no-underscore-dangle
          expect(one.__OPAQUE__).toEqual('__OPAQUE__');

          // eslint-disable-next-line no-underscore-dangle
          expect(one.__OPAQUE_KEY__).toEqual('One');

          // eslint-disable-next-line no-underscore-dangle
          expect(one.__OPAQUE_VARIATION__).toEqual('var1');
        });
      });

      describe('is', () => {
        it('is a type guard for any instance of the union', () => {
          const one = UnionAPIVar1.of.One.var1({ value: 'one' });
          const two = UnionAPIVar1.of.Two.var1({ value: 'two' });

          expect(UnionAPIVar1.is(one)).toEqual(true);
          expect(UnionAPIVar1.is(two)).toEqual(true);
          expect(UnionAPIVar1.is(2)).toEqual(false);
          expect(UnionAPIVar1.is({})).toEqual(false);
          expect(
            UnionAPIVar1.is({
              __OPAQUE__: '__OPAQUE__',
              __OPAQUE_KEY__: 'tototo',
              __OPAQUE_VARIATION__: 'default',
            }),
          ).toEqual(false);
        });

        it('respects variation', () => {
          const one1 = UnionAPIVar1.of.One.var1({ value: 'one' });
          const one2 = UnionAPI.of.One.var1({ value: 'one' });

          expect(UnionAPIVar1.is(one1)).toEqual(true);

          expect(UnionAPIVar1.is(one2) && UnionAPIVar2.is(one2)).toEqual(false);
          expect(UnionAPIVar1.is(one2) || UnionAPIVar2.is(one2)).toEqual(true);

          expect(UnionAPI.is(one1)).toEqual(true);
          expect(UnionAPI.is(one2)).toEqual(true);
        });

        it('exposes a type guard for each type', () => {
          const one1 = UnionAPI.of.One.var1({ value: 'one' });
          const one2 = UnionAPI.of.One.var2({ value: 'one' });
          const two1 = UnionAPI.of.Two.var1({ value: 'two' });
          const two2 = UnionAPI.of.Two.var2({ value: 'two' });

          expect(UnionAPI.is.One(one1)).toEqual(true);
          expect(UnionAPI.is.One(one2)).toEqual(true);
          expect(UnionAPI.is.One(two1)).toEqual(false);
          expect(UnionAPI.is.One(two2)).toEqual(false);

          expect(UnionAPIVar1.is.One(one1)).toEqual(true);
          // eslint-disable-next-line @typescript-eslint/ban-ts-comment
          // @ts-expect-error
          expect(UnionAPIVar1.is.One(one2)).toEqual(false);
          expect(UnionAPIVar1.is.One(two1)).toEqual(false);
          // eslint-disable-next-line @typescript-eslint/ban-ts-comment
          // @ts-expect-error
          expect(UnionAPIVar1.is.One(two2)).toEqual(false);

          // eslint-disable-next-line @typescript-eslint/ban-ts-comment
          // @ts-expect-error
          expect(UnionAPI.is.One(2)).toEqual(false);
          // eslint-disable-next-line @typescript-eslint/ban-ts-comment
          // @ts-expect-error
          expect(UnionAPI.is.One({})).toEqual(false);
        });

        it('exposes a type guard for each type for each variation', () => {
          const one1 = UnionAPI.of.One.var1({ value: 'one' });

          expect(UnionAPI.is.One.var1(one1)).toEqual(true);
          expect(UnionAPI.is.One.var2(one1)).toEqual(false);

          expect(UnionAPIVar1.is.One.var1(one1)).toEqual(true);

          // eslint-disable-next-line @typescript-eslint/ban-ts-comment
          // @ts-expect-error
          expect(UnionAPI.is.One.var1(2)).toEqual(false);
          // eslint-disable-next-line @typescript-eslint/ban-ts-comment
          // @ts-expect-error
          expect(UnionAPI.is.One.var1({})).toEqual(false);
        });

        it('exposes a type guard for each variation', () => {
          const one1 = UnionAPI.of.One.var1({ value: 'one' });
          const one2 = UnionAPI.of.One.var2({ value: 'one' });
          const two1 = UnionAPI.of.Two.var1({ value: 'two' });
          const two2 = UnionAPI.of.Two.var2({ value: 'two' });

          expect(UnionAPI.is.var1(one1)).toEqual(true);
          expect(UnionAPI.is.var1(one2)).toEqual(false);
          expect(UnionAPI.is.var1(two1)).toEqual(true);
          expect(UnionAPI.is.var1(two2)).toEqual(false);

          expect(UnionAPIOne.is.var1(one1)).toEqual(true);
          // eslint-disable-next-line @typescript-eslint/ban-ts-comment
          // @ts-expect-error
          expect(UnionAPIOne.is.var1(two1)).toEqual(false);

          // eslint-disable-next-line @typescript-eslint/ban-ts-comment
          // @ts-expect-error
          expect(UnionAPI.is.var1(2)).toEqual(false);
          // eslint-disable-next-line @typescript-eslint/ban-ts-comment
          // @ts-expect-error
          expect(UnionAPI.is.var1({})).toEqual(false);
        });

        it('exposes a type guard for each variation for each type', () => {
          const one1 = UnionAPI.of.One.var1({ value: 'one' });

          expect(UnionAPI.is.var1.One(one1)).toEqual(true);
          expect(UnionAPI.is.var1.Two(one1)).toEqual(false);

          expect(UnionAPIOne.is.var1.One(one1)).toEqual(true);

          // eslint-disable-next-line @typescript-eslint/ban-ts-comment
          // @ts-expect-error
          expect(UnionAPI.is.var1.One(2)).toEqual(false);
          // eslint-disable-next-line @typescript-eslint/ban-ts-comment
          // @ts-expect-error
          expect(UnionAPI.is.var1.One({})).toEqual(false);
        });
      });

      describe('fold', () => {
        it('is present globally', () => {
          const one = UnionAPIVar1.of.One.var1({ value: 'one' });

          const result = UnionAPIVar1.fold({
            One: () => 'one',
            Two: () => 'two',
          })(one);

          expect(result).toEqual('one');
        });

        it('is present for each type', () => {
          const one = UnionAPI.of.One.var1({ value: 'one' });

          const result = UnionAPI.One.fold({
            var1: () => 'one',
            var2: () => 'two',
          })(one);

          expect(result).toEqual('one');
        });

        it('is present for each variation', () => {
          const one = UnionAPI.of.One.var1({ value: 'one' });

          const result = UnionAPI.var1.fold({
            One: () => 'one',
            Two: () => 'two',
          })(one);

          expect(result).toEqual('one');
        });

        it('accepts subtypes', () => {
          const one = UnionAPI.of.One.var1({ value: 'one' });

          UnionAPI.fold<string, UnionType>({
            // eslint-disable-next-line @typescript-eslint/ban-ts-comment
            // @ts-expect-error
            // eslint-disable-next-line @typescript-eslint/no-unused-vars
            One: (_: Union.Opaque<'One', 'var1'>) => 'one',
            Two: () => 'two',
          })(one);

          const result = UnionAPI.fold<string, UnionTypeVar1>({
            // eslint-disable-next-line @typescript-eslint/no-unused-vars
            One: (_: Union.Opaque<'One', 'var1'>) => 'one',
            Two: () => 'two',
          })(one);

          expect(result).toEqual('one');
        });
      });

      describe('iso', () => {
        it('is present globally', () => {
          expectType<
            Iso<
              | Union.Opaque<'One', 'var1'>
              | Union.Opaque<'Two', 'var1'>
              | Union.Opaque<'One', 'var2'>
              | Union.Opaque<'Two', 'var2'>,
              | Union.Tagged<'One', 'var1', One>
              | Union.Tagged<'One', 'var2', One>
              | Union.Tagged<'Two', 'var1', Two>
              | Union.Tagged<'Two', 'var2', Two>
            >
          >(UnionAPI.iso);

          const one = UnionAPI.of.One.var1({ value: 'one' });

          const $instance = UnionAPI.iso.get(one);

          expect($instance).toEqual({
            _tag: 'One',
            _variation: 'var1',
            value: 'one',
          });

          const $instanceBis = {
            _tag: 'One' as const,
            _variation: 'var1' as const,
            value: 'one' as const,
          };

          const oneBis = UnionAPI.iso.reverseGet($instanceBis);

          expect(oneBis).toEqual(one);
        });

        it('is present for each type', () => {
          expectType<Iso<Union.Opaque<'One', 'var1'>, One>>(
            UnionAPI.One.var1.iso,
          );
          expectType<Iso<Union.Opaque<'Two', 'var1'>, Two>>(
            UnionAPI.Two.var1.iso,
          );

          const one = UnionAPI.of.One.var1({ value: 'one' });

          const $one = UnionAPI.One.var1.iso.get(one);

          expect($one).toEqual({
            value: 'one',
          });

          const oneBis = UnionAPI.One.var1.iso.reverseGet({
            value: 'one',
          });

          expect(oneBis).toEqual(one);
        });

        it('is present for default variation', () => {
          expectType<Iso<Union.Opaque<'One', 'default'>, One>>(
            SimpleUnionAPI.One.iso,
          );
          expectType<Iso<Union.Opaque<'Two', 'default'>, Two>>(
            SimpleUnionAPI.Two.iso,
          );

          const one = SimpleUnionAPI.of.One({ value: 'one' });

          const $one = SimpleUnionAPI.One.iso.get(one);

          expect($one).toEqual({
            value: 'one',
          });

          const oneBis = SimpleUnionAPI.One.iso.reverseGet({
            value: 'one',
          });

          expect(oneBis).toEqual(one);
        });

        it('is present for each variation', () => {
          expectType<
            Iso<
              Union.Opaque<'One', 'var1'> | Union.Opaque<'Two', 'var1'>,
              | Union.Tagged<'One', 'var1', One>
              | Union.Tagged<'Two', 'var1', Two>
            >
          >(UnionAPI.var1.iso);

          expectType<
            Iso<
              Union.Opaque<'One', 'var2'> | Union.Opaque<'Two', 'var2'>,
              | Union.Tagged<'One', 'var2', One>
              | Union.Tagged<'Two', 'var2', Two>
            >
          >(UnionAPI.var2.iso);

          const one = UnionAPIVar1.of.One.var1({ value: 'one' });

          const $one = UnionAPIVar1.var1.iso.get(one);

          expect($one).toEqual({
            _tag: 'One',
            _variation: 'var1',
            value: 'one',
          });

          const oneBis = UnionAPIVar1.var1.iso.reverseGet({
            _tag: 'One',
            _variation: 'var1',
            value: 'one',
          });

          expect(oneBis).toEqual(one);
        });

        it('is present for each variation for each name', () => {
          expectType<Iso<Union.Opaque<'One', 'var1'>, One>>(
            UnionAPI.var1.One.iso,
          );

          expectType<Iso<Union.Opaque<'Two', 'var1'>, Two>>(
            UnionAPI.var1.Two.iso,
          );

          expectType<Iso<Union.Opaque<'One', 'var2'>, One>>(
            UnionAPI.var2.One.iso,
          );

          expectType<Iso<Union.Opaque<'Two', 'var2'>, Two>>(
            UnionAPI.var2.Two.iso,
          );

          const one = UnionAPIVar1.of.One.var1({ value: 'one' });

          const $one = UnionAPIVar1.var1.One.iso.get(one);

          expect($one).toEqual({
            value: 'one',
          });

          const oneBis = UnionAPIVar1.var1.One.iso.reverseGet({
            value: 'one',
          });

          expect(oneBis).toEqual(one);
        });
      });

      describe('lensFromProp', () => {
        it('is present globally', () => {
          const lens = UnionAPIVar1.lensFromProp('value');

          expectType<
            Lens<
              Union.Opaque<'One', 'var1'> | Union.Opaque<'Two', 'var1'>,
              'one' | 'two'
            >
          >(lens);

          const one = UnionAPIVar1.of.One.var1({ value: 'one' });
          const value = lens.get(one);

          expect(value).toEqual('one');
        });

        it('is present for each type', () => {
          const lensOne = UnionAPIVar1.One.var1.lensFromProp('value');
          expectType<Lens<Union.Opaque<'One', 'var1'>, 'one'>>(lensOne);

          const lensTwo = UnionAPIVar1.Two.var1.lensFromProp('value');
          expectType<Lens<Union.Opaque<'Two', 'var1'>, 'two'>>(lensTwo);

          const one = UnionAPIVar1.of.One.var1({ value: 'one' });
          const value = lensOne.get(one);

          expect(value).toEqual('one');
        });

        it('is present for default variation', () => {
          const lensOne = SimpleUnionAPI.One.lensFromProp('value');
          expectType<Lens<Union.Opaque<'One', 'default'>, 'one'>>(lensOne);

          const lensTwo = SimpleUnionAPI.Two.lensFromProp('value');
          expectType<Lens<Union.Opaque<'Two', 'default'>, 'two'>>(lensTwo);

          const one = SimpleUnionAPI.of.One({ value: 'one' });
          const value = lensOne.get(one);

          expect(value).toEqual('one');
        });

        it('is present for each variation', () => {
          const lensOne = UnionAPI.var1.lensFromProp('value');
          expectType<
            Lens<
              Union.Opaque<'One', 'var1'> | Union.Opaque<'Two', 'var1'>,
              'one' | 'two'
            >
          >(lensOne);

          const lensTwo = UnionAPI.var2.lensFromProp('value');
          expectType<
            Lens<
              Union.Opaque<'One', 'var2'> | Union.Opaque<'Two', 'var2'>,
              'one' | 'two'
            >
          >(lensTwo);

          const one = UnionAPIVar1.of.One.var1({ value: 'one' });
          const value = lensOne.get(one);

          expect(value).toEqual('one');
        });

        it('is present for each variation for each types', () => {
          const lensOne = UnionAPI.var1.One.lensFromProp('value');
          expectType<Lens<Union.Opaque<'One', 'var1'>, 'one'>>(lensOne);

          const lensTwo = UnionAPI.var1.Two.lensFromProp('value');
          expectType<Lens<Union.Opaque<'Two', 'var1'>, 'two'>>(lensTwo);

          const lensOne2 = UnionAPI.var2.One.lensFromProp('value');
          expectType<Lens<Union.Opaque<'One', 'var2'>, 'one'>>(lensOne2);

          const lensTwo2 = UnionAPI.var2.Two.lensFromProp('value');
          expectType<Lens<Union.Opaque<'Two', 'var2'>, 'two'>>(lensTwo2);

          const one = UnionAPIVar1.of.One.var1({ value: 'one' });
          const value = lensOne.get(one);

          expect(value).toEqual('one');
        });
      });
    });
  });
});
