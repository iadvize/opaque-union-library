import { Lens, Iso } from 'monocle-ts';

import { createFoldObject } from '@iadvize-oss/foldable-helpers';

/**
 * All opaque variables you create with the library will have the type of
 * `Opaque<'SomeName', 'SomeVariation>`.
 *
 * @remarks
 * You can't really do anything with it. So, don't try to use them directly!
 * Use the library functions instead.
 *
 * @typeParam Name - The name of the opaque
 * @typeParam Variation - The variation of the opaque
 */
export type Opaque<Name, Variation> = {
  /**
   * @internal
   */
  readonly __OPAQUE__: '__OPAQUE__';

  /**
   * Where the type of opaque is stored
   *
   * @internal
   */
  readonly __OPAQUE_KEY__: Name;

  /**
   * Where the variation is stored.
   *
   * @internal
   */
  readonly __OPAQUE_VARIATION__: Variation;

  /**
   * Where the private value is stored
   *
   * @internal
   */
  readonly value: unknown;
};

type PossibleNames = string | number | symbol;
type PossibleVariations = string | number | symbol;

/**
 * Mapped type to store Opaques by name and variation
 */
export type Opaques<
  Names extends PossibleNames,
  Variations extends PossibleVariations,
> = {
  [name in Names]: {
    [variation in Variations]: Opaque<name, variation>;
  }[Variations];
}[Names];

/**
 * To be used only in the context of {@link of | Union.of} to attach private
 * type to the corresponding name in the union.
 *
 * @example
```typescript
  import * as Union from '@iadvize-oss/opaque-union';

  const MessageAPI = Union.of({
    Text: Union.type<$Text>(),
    Image: Union.type<$Image>(),
  });
```
 *
 * @typeParam T - The private type to assign to the corresponding name
 *
 * @returns Something. Do not rely on it. Used internaly only.
 */
export function type<T>(): T {
  return undefined as unknown as T;
}

/**
 * Fold functions definition. A kind of pattern matching for unions created with
 * the library.
 *
 * @example
```typescript
  import * as Union from '@iadvize-oss/opaque-union';

  const MessageAPI = Union.of({
    Text: Union.type<$Text>(),
    Image: Union.type<$Image>(),
  });

  type Text = ReturnType<typeof MessageAPI.of.Text>;
  type Image = ReturnType<typeof MessageAPI.of.Image>;

  MessageAPI.fold({
    Test: (message: Text) => 'text',
    Image: (message: Image) => 'image',
  })
```
 *
 * @example
```typescript
  import * as Union from '@iadvize-oss/opaque-union';

  const MessageAPI = Union.ofVariations({
    Text: {
      Sent: Union.type<$Text>(),
      Pending: Union.type<$Text>(),
    },
    Image: {
      Sent: Union.type<$Image>(),
      Pending: Union.type<$Image>(),
    },
  });

  const MessageSentAPI = Union.omitVariations(['Pending']);
  type MessageSent = Union.Type<typeof MessageSentAPI>;

  type TextSent = ReturnType<typeof MessageAPI.of.Text.Sent>;
  type ImageSent = ReturnType<typeof MessageAPI.of.Image.Sent>;

  MessageAPI.fold<string, MessageSent>({
    Test: (message: TextSent) => 'text',
    Image: (message: ImageSent) => 'image',
  })
```
 * *
 * @internal
 */
type Fold<Types> = {
  /**
   * Basic definition: each function we provide for subtype take the full
   * subtype
   */
  <R>(
    funcs: {
      [key in keyof Types]: (s: Types[key]) => R;
    },
  ): (s: Types[keyof Types]) => R;

  /**
   * Extended definition: we can filter the types we fold on, specialy usefull
   * when we want to exclude some variations
   */
  <R, S extends Types[keyof Types]>(
    funcs: {
      [key in keyof Types]: (s: Extract<S, Types[key]>) => R;
    },
  ): (s: S) => R;
};

/**
 * Helper to type lensFromProp functions
 *
 * @internal
 */
type LensFromProp<
  Names extends PossibleNames,
  Variations extends PossibleVariations,
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  Types extends { [name in Names]: { [variation in Variations]: any } },
> = {
  /**
   * Basic definition: we work on the full Opaques\<Names, Variations\>
   */
  <Prop extends keyof Types[Names][Variations]>(prop: Prop): Lens<
    Opaques<Names, Variations>,
    Types[Names][Variations][Prop]
  >;

  /**
   * Exctended definition: we work on a subtype of Opaques\<Names, Variations\>
   */
  <
    C extends Opaques<Names, Variations>,
    Prop extends keyof Types[Names][Variations],
  >(
    prop: Prop,
  ): Lens<C, Types[Names][Variations][Prop]>;
};

/**
 * Helper type to add a prop `_tag` on T
 * Usefull for ISO
 *
 * @typeParam T - The type to decorate
 * @typeParam Key - The name to give the type
 * @typeParam Variations - The variations
 */
export type Tagged<
  Name extends PossibleNames,
  Variation extends PossibleVariations,
  Type,
> = Type & {
  readonly _tag: Name;
  readonly _variation: Variation;
};

/**
 * Mapped type to store `Tagged` types
 * Usefull for ISO
 *
 * @internal
 *
 * @typeParam Types - Collection of private types of the union
 * @typeParam Keys - Keys of `Types` to map over
 */
type TaggedTypes<
  Names extends PossibleNames,
  Variations extends PossibleVariations,
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  Types extends { [name in Names]: { [variation in Variations]: any } },
> = {
  [name in Names]: {
    [variation in Variations]: Tagged<name, variation, Types[name][variation]>;
  }[Variations];
};

/*
 * @internal
 */
type OfAll<
  Names extends PossibleNames,
  Variations extends PossibleVariations,
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  Types extends { [name in Names]: { [variation in Variations]: any } },
> = <
  Name extends Names,
  Variation extends Variations,
  Type extends Types[Name][Variation],
>(
  name: Name,
  variation: Variation,
  value: Type,
) => Opaque<Name, Variation>;

/*
 * @internal
 */
type OfTypes<
  Names extends PossibleNames,
  Variations extends PossibleVariations,
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  Types extends { [name in Names]: { [variation in Variations]: any } },
> = {
  [name in Names]: (Variations extends 'default'
    ? (value: Types[name][Variations]) => Opaque<name, 'default'>
    : <Variation extends Variations, Type extends Types[name][Variation]>(
        variation: Variation,
        value: Type,
      ) => Opaque<name, Variation>) &
    {
      [variation in Variations]: (
        value: Types[name][variation],
      ) => Opaque<name, variation>;
    };
};

/*
 * @internal
 */
type OfVariations<
  Names extends PossibleNames,
  Variations extends PossibleVariations,
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  Types extends { [name in Names]: { [variation in Variations]: any } },
> = {
  [variation in Variations]: (<
    Name extends Names,
    Type extends Types[Name][variation],
  >(
    name: Name,
    value: Type,
  ) => Opaque<Name, variation>) &
    {
      [name in Names]: (
        value: Types[name][variation],
      ) => Opaque<name, variation>;
    };
};

/**
 * Constructor for opaque types
 *
```typescript
  import * as Union from '@iadvize-oss/opaque-union';

  const MessageAPI = Union.ofVariations({
    Text: {
      Sent: Union.type<$Text>(),
      Pending: Union.type<$Text>(),
    },
    Image: {
      Sent: Union.type<$Image>(),
      Pending: Union.type<$Image>(),
    },
  });

  MessageAPI.of('Text', 'Sent', { content: 'hello world' });
  MessageAPI.of.Text('Sent', { content: 'hello world' });
  MessageAPI.of.Text.Sent({ content: 'hello world' });
  MessageAPI.of.Sent('Text', { content: 'hello world' });
  MessageAPI.of.Sent.Text({ content: 'hello world' });
```
 *
 * @typeParam Types - Private types
 * @typeParam Keys - Keys of `Types` to map over
 *
 * @internal
 */
type Of<
  Names extends PossibleNames,
  Variations extends PossibleVariations,
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  Types extends { [name in Names]: { [variation in Variations]: any } },
> = OfAll<Names, Variations, Types> &
  OfTypes<Names, Variations, Types> &
  OfVariations<Names, Variations, Types>;

/*
 * @internal
 */
type IsAll<Names extends PossibleNames, Variations extends PossibleVariations> =
  (
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    thing: any,
  ) => thing is Opaques<Names, Variations>;

/*
 * @internal
 */
type IsTypes<
  Names extends PossibleNames,
  Variations extends PossibleVariations,
> = {
  [name in Names]: ((
    opaque: Opaques<Names, Variations>,
  ) => opaque is Opaques<name, Variations>) &
    {
      [variation in Variations]: (
        opaque: Opaques<name, Variations>,
      ) => opaque is Opaques<name, variation>;
    };
};

/*
 * @internal
 */
type IsVariations<
  Names extends PossibleNames,
  Variations extends PossibleVariations,
> = {
  [variation in Variations]: ((
    opaque: Opaques<Names, Variations>,
  ) => opaque is Opaques<Names, variation>) &
    {
      [name in Names]: (
        opaque: Opaques<Names, variation>,
      ) => opaque is Opaques<name, variation>;
    };
};

/**
 * Type guard for any union member
 *
```typescript
  import * as Union from '@iadvize-oss/opaque-union';

  const MessageAPI = Union.ofVariations({
    Text: {
      Sent: Union.type<$Text>(),
      Pending: Union.type<$Text>(),
    },
    Image: {
      Sent: Union.type<$Image>(),
      Pending: Union.type<$Image>(),
    },
  });

  const text = Union.of.Text.Sent({ content: 'hello world' });

  UnionAPI.is('test'); // false
  UnionAPI.is(text); // true, text is Text | Image
  UnionAPI.is.Text(text); // true, text is Text
  UnionAPI.is.Text(text); // true, text is Text
  UnionAPI.is.Sent(text); // true, text is variation sent
  UnionAPI.is.Text.Sent(text); // true, text is Text and variation Sent
  UnionAPI.is.Sent.Text(text); // true, text is Text and variation Sent
```
 *
 * @typeParam Types - Private types
 * @typeParam Keys - Keys of `Types` to map over
 *
 * @param thing - Anything
 *
 * @returns Type guard result
 */
type Is<Names extends PossibleNames, Variations extends PossibleVariations> =
  IsTypes<Names, Variations> &
    IsVariations<Names, Variations> &
    IsAll<Names, Variations>;

type ForTypes<
  Names extends PossibleNames,
  Variations extends PossibleVariations,
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  Types extends { [name in Names]: { [variation in Variations]: any } },
> = {
  [name in Names]: (Variations extends 'default'
    ? {
        iso: Iso<Opaque<name, Variations>, Types[name][Variations]>;
        lensFromProp: LensFromProp<name, Variations, Types>;
      }
    : {}) &
    {
      [variation in Variations]: {
        iso: Iso<Opaque<name, variation>, Types[name][variation]>;
        lensFromProp: LensFromProp<name, variation, Types>;
      };
    } & {
      fold: Fold<{ [variation in Variations]: Opaque<name, variation> }>;
    };
};

type ForVariations<
  Names extends PossibleNames,
  Variations extends PossibleVariations,
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  Types extends { [name in Names]: { [variation in Variations]: any } },
> = {
  [variation in Variations]: {
    iso: Iso<
      Opaques<Names, variation>,
      TaggedTypes<Names, variation, Types>[Names]
    >;

    lensFromProp: LensFromProp<Names, variation, Types>;
  } & {
    [name in Names]: {
      iso: Iso<Opaque<name, variation>, Types[name][variation]>;
      lensFromProp: LensFromProp<name, variation, Types>;
    };
  } & {
      fold: Fold<{ [name in Names]: Opaque<name, variation> }>;
    };
};

/**
 * Some [`monocle-ts`](https://github.com/gcanti/monocle-ts) optics for each
 * member of the union
 *
 * For each member you will get an `Iso<Opaque, Type>` and a `lensFromProp`
 * function
 *
 * @example
```typescript
const iso = MessageAPI.Text.iso; // Iso<Opaque<Type>, Type>

// fromOpaque :: (text: Text) => $Text
const fromOpaque = iso.from;

// toOpaque :: ($text: $Text) => Text
const toOpaque = iso.to;
```
 *
 * @example
```typescript
// source :: (image: Image) => string
export const source = MessageAPI.Image.lensFromProp('source').get;
```
 *
 * @typeParam Types - Collection of private types of the union
 * @typeParam Keys - Keys of `Types` to map over
 */
type For<
  Names extends PossibleNames,
  Variations extends PossibleVariations,
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  Types extends { [name in Names]: { [variation in Variations]: any } },
> = ForTypes<Names, Variations, Types> &
  ForVariations<Names, Variations, Types>;

/**
 * The union api
 *
 * @typeParam Types - Collection of private types of the union
 * @typeParam Keys - Keys of `Types` to map over
 */
export type UnionAPIDef<
  Names extends PossibleNames,
  Variations extends PossibleVariations,
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  Types extends { [name in Names]: { [variation in Variations]: any } },
> = {
  /**
   * Storing Types object here
   *
   * @privateRemarks
   * Specialy useful for helper functions like merge.
   */
  types: Types;

  /**
   * {@inheritDoc Of}
   */
  of: Of<Names, Variations, Types>;

  /**
   * {@inheritDoc Is}
   */
  is: Is<Names, Variations>;

  /**
   * {@inheritDoc Fold}
   */
  fold: Fold<{ [name in Names]: Opaques<name, Variations> }>;

  /**
   * Iso between any member of the union and any private types (tagged)
   *
   * {@link Tagged}
   */
  iso: Iso<
    Opaques<Names, Variations>,
    TaggedTypes<Names, Variations, Types>[Names]
  >;

  /**
   * {@inheritDoc LensFromProp}
   */
  lensFromProp: LensFromProp<Names, Variations, Types>;
} & For<Names, Variations, Types>;

/**
 * This will extract all opaque types of a union API. This is more robust to
 * change than creating the union of types yourself.
 *
 * @example
```typescript
// instead of:

type Text = ReturnType<typeof MessageAPI.of.Text>;
type Image = ReturnType<typeof MessageAPI.of.Image>;
type Video = ReturnType<typeof MessageAPI.of.Video>;

export type Message = Text | Image | Video;

// do:

import * as Union from '@iadvize-oss/opaque-union';

export type Message = Union.Type<typeof MessageAPI>;
```
 *
 * @typeParam Def - The union api definition
 */
export type Type<Def, VariationFilter = string> = Def extends UnionAPIDef<
  infer Names,
  infer Variations,
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  any
>
  ? Opaques<Names, Variations & VariationFilter>
  : never;

/**
 * Use `of` to create your opaque entities API.
 *
 * @remarks
 * Ideally, don't share the API outsite your module as this will give module
 * users the possibility to "unopaque" your types and bypass your module API.
 *
 * @example
```typescript
import * as Union from '@iadvize-oss/opaque-union';

type $Text = string;

type $Image = {
  source: string;
  description: string;
}

const MessageAPI = Union.of({
  Text: Union.type<$Text>(),
  Image: Union.type<$Image>(),
});
```
 *
 * @typeParam Types - The collection of private types for the union
 *
 * @param  types - The map of names and results of {@link "type" | `type`}
 *                 function
 *
 * @returns A union api
 */
export function ofVariations<
  Types extends {
    [key in keyof Types]: {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      [key: string]: any;
    };
  },
>(types: Types): UnionAPIDef<keyof Types, keyof Types[keyof Types], Types> {
  type Names = keyof Types;
  type Variations = keyof Types[keyof Types];

  const names = Object.keys(types) as Names[];
  const variations = Object.keys(types[names[0]]) as Variations[];

  const ofsTypes = names.reduce((localOfTypes, name) => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const defaultOf = function (variation: any, value: any) {
      if (arguments.length <= 1) {
        // eslint-disable-next-line no-param-reassign
        value = variation;
        // eslint-disable-next-line no-param-reassign
        variation = 'default';
      }

      return {
        __OPAQUE__: '__OPAQUE__',
        __OPAQUE_KEY__: name,
        __OPAQUE_VARIATION__: variation,
        value,
      };
    };

    variations.forEach((variation) => {
      // eslint-disable-next-line @typescript-eslint/ban-ts-comment
      // @ts-ignore
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      defaultOf[variation] = (value: any) => ({
        __OPAQUE__: '__OPAQUE__',
        __OPAQUE_KEY__: name,
        __OPAQUE_VARIATION__: variation,
        value,
      });
    });

    return {
      ...localOfTypes,
      [name]: defaultOf,
    };
  }, {}) as OfTypes<Names, Variations, Types>;

  const ofsVariations = variations.reduce((localOfVariations, variation) => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const defaultOf = (name: string, value: any) => ({
      __OPAQUE__: '__OPAQUE__',
      __OPAQUE_KEY__: name,
      __OPAQUE_VARIATION__: variation,
      value,
    });

    names.forEach((name) => {
      // eslint-disable-next-line @typescript-eslint/ban-ts-comment
      // @ts-ignore
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      defaultOf[name] = (value: any) => ({
        __OPAQUE__: '__OPAQUE__',
        __OPAQUE_KEY__: name,
        __OPAQUE_VARIATION__: variation,
        value,
      });
    });

    return {
      ...localOfVariations,
      [variation]: defaultOf,
    };
  }, {}) as OfVariations<Names, Variations, Types>;

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const ofAll = ((name: Names, variation: Variations, value: any) => ({
    __OPAQUE__: '__OPAQUE__',
    __OPAQUE_KEY__: name,
    __OPAQUE_VARIATION__: variation,
    value,
  })) as OfAll<Names, Variations, Types> &
    OfTypes<Names, Variations, Types> &
    OfVariations<Names, Variations, Types>;

  names.forEach((name) => {
    // eslint-disable-next-line @typescript-eslint/ban-ts-comment
    // @ts-ignore
    ofAll[name] = ofsTypes[name];
  });

  variations.forEach((variation) => {
    // eslint-disable-next-line @typescript-eslint/ban-ts-comment
    // @ts-ignore
    ofAll[variation] = ofsVariations[variation];
  });

  const isTypes = names.reduce((localIsTypes, name) => {
    const defaultIs = (thing: Opaque<Names, Variations>) => {
      if (typeof thing !== 'object') {
        return false;
      }

      if (
        !(
          '__OPAQUE__' in thing &&
          // eslint-disable-next-line no-underscore-dangle
          thing.__OPAQUE__ === '__OPAQUE__' &&
          '__OPAQUE_KEY__' in thing &&
          '__OPAQUE_VARIATION__' in thing
        )
      ) {
        return false;
      }

      // eslint-disable-next-line no-underscore-dangle
      if (thing.__OPAQUE_KEY__ !== name) {
        return false;
      }

      // eslint-disable-next-line no-underscore-dangle
      if (variations.includes(thing.__OPAQUE_VARIATION__)) {
        return true;
      }

      return false;
    };

    variations.forEach((variation) => {
      // eslint-disable-next-line @typescript-eslint/ban-ts-comment
      // @ts-ignore
      defaultIs[variation] = (thing: Opaque<Names, Variations>) => {
        if (typeof thing !== 'object') {
          return false;
        }

        if (
          !(
            '__OPAQUE__' in thing &&
            // eslint-disable-next-line no-underscore-dangle
            thing.__OPAQUE__ === '__OPAQUE__' &&
            '__OPAQUE_KEY__' in thing &&
            '__OPAQUE_VARIATION__' in thing
          )
        ) {
          return false;
        }

        // eslint-disable-next-line no-underscore-dangle
        if (thing.__OPAQUE_KEY__ !== name) {
          return false;
        }

        // eslint-disable-next-line no-underscore-dangle
        if (thing.__OPAQUE_VARIATION__ === variation) {
          return true;
        }

        return false;
      };
    });

    return {
      ...localIsTypes,
      [name]: defaultIs,
    };
  }, {}) as IsTypes<Names, Variations>;

  const isVariations = variations.reduce((localIsVariations, variation) => {
    const defaultIs = (thing: Opaque<Names, Variations>) => {
      if (typeof thing !== 'object') {
        return false;
      }

      if (
        !(
          '__OPAQUE__' in thing &&
          // eslint-disable-next-line no-underscore-dangle
          thing.__OPAQUE__ === '__OPAQUE__' &&
          '__OPAQUE_KEY__' in thing &&
          '__OPAQUE_VARIATION__' in thing
        )
      ) {
        return false;
      }

      // eslint-disable-next-line no-underscore-dangle
      if (thing.__OPAQUE_VARIATION__ !== variation) {
        return false;
      }

      // eslint-disable-next-line no-underscore-dangle
      if (names.includes(thing.__OPAQUE_KEY__)) {
        return true;
      }

      return false;
    };

    names.forEach((name) => {
      // eslint-disable-next-line @typescript-eslint/ban-ts-comment
      // @ts-ignore
      defaultIs[name] = (thing: Opaque<Names, Variations>) => {
        if (typeof thing !== 'object') {
          return false;
        }

        if (
          !(
            '__OPAQUE__' in thing &&
            // eslint-disable-next-line no-underscore-dangle
            thing.__OPAQUE__ === '__OPAQUE__' &&
            '__OPAQUE_KEY__' in thing &&
            '__OPAQUE_VARIATION__' in thing
          )
        ) {
          return false;
        }

        // eslint-disable-next-line no-underscore-dangle
        if (thing.__OPAQUE_KEY__ !== name) {
          return false;
        }

        // eslint-disable-next-line no-underscore-dangle
        if (thing.__OPAQUE_VARIATION__ === variation) {
          return true;
        }

        return false;
      };
    });

    return {
      ...localIsVariations,
      [variation]: defaultIs,
    };
  }, {}) as IsVariations<Names, Variations>;

  const isAll = ((
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    thing: any,
  ): thing is Opaques<Names, Variations> => {
    if (typeof thing !== 'object') {
      return false;
    }

    if (
      !(
        '__OPAQUE__' in thing &&
        // eslint-disable-next-line no-underscore-dangle
        thing.__OPAQUE__ === '__OPAQUE__' &&
        '__OPAQUE_KEY__' in thing &&
        '__OPAQUE_VARIATION__' in thing
      )
    ) {
      return false;
    }

    // eslint-disable-next-line no-underscore-dangle
    const keyIndex = names.indexOf(thing.__OPAQUE_KEY__);

    if (keyIndex === -1) {
      return false;
    }

    // eslint-disable-next-line no-underscore-dangle
    if (variations.includes(thing.__OPAQUE_VARIATION__)) {
      return true;
    }

    return false;
  }) as IsAll<Names, Variations> &
    IsTypes<Names, Variations> &
    IsVariations<Names, Variations>;

  names.forEach((name) => {
    // eslint-disable-next-line @typescript-eslint/ban-ts-comment
    // @ts-ignore
    isAll[name] = isTypes[name];
  });

  variations.forEach((variation) => {
    // eslint-disable-next-line @typescript-eslint/ban-ts-comment
    // @ts-ignore
    isAll[variation] = isVariations[variation];
  });

  // eslint-disable-next-line @typescript-eslint/ban-ts-comment
  // @ts-ignore
  const foldAll = createFoldObject(isTypes) as Fold<
    { [name in Names]: Opaques<name, Variations> }
  >;

  const forTypes = names.reduce((localForTypes, name) => {
    const get = (opaque: Opaque<Names, Variations>) => {
      return opaque.value as Types[Names][Variations];
    };

    const defaultFor = (() => {
      const reverseGet = ofsTypes[name as Names].default;

      // eslint-disable-next-line @typescript-eslint/ban-ts-comment
      // @ts-ignore
      const iso = new Iso(get, reverseGet);

      return {
        ...localForTypes,
        [name]: {
          iso,
          lensFromProp: <Prop>(prop: Prop) => {
            // eslint-disable-next-line @typescript-eslint/ban-ts-comment
            // @ts-ignore
            const lens = Lens.fromProp()(prop);

            // eslint-disable-next-line @typescript-eslint/ban-ts-comment
            // @ts-ignore
            return iso.composeLens(lens);
          },
          // eslint-disable-next-line @typescript-eslint/ban-ts-comment
          // @ts-ignore
          fold: createFoldObject(isVariations),
        },
      };
    })();

    variations.forEach((variation) => {
      const reverseGet = ofsTypes[name as Names][variation as Variations];

      // eslint-disable-next-line @typescript-eslint/ban-ts-comment
      // @ts-ignore
      const iso = new Iso(get, reverseGet);

      const variationLenses = {
        iso,
        lensFromProp: <Prop>(prop: Prop) => {
          // eslint-disable-next-line @typescript-eslint/ban-ts-comment
          // @ts-ignore
          const lens = Lens.fromProp()(prop);

          // eslint-disable-next-line @typescript-eslint/ban-ts-comment
          // @ts-ignore
          return iso.composeLens(lens);
        },
      };

      // eslint-disable-next-line @typescript-eslint/ban-ts-comment
      // @ts-ignore
      defaultFor[name][variation] = variationLenses;
    });

    return defaultFor;
  }, {}) as ForTypes<Names, Variations, Types>;

  const forVariations = variations.reduce((localForVariations, variation) => {
    const get = (opaque: Opaque<Names, Variations>) => {
      return opaque.value as Types[Names][Variations];
    };

    const iso = new Iso<
      Opaques<Names, Variations>,
      TaggedTypes<Names, Variations, Types>[Names]
    >(
      (opaque: Opaques<Names, Variations>) => ({
        // eslint-disable-next-line no-underscore-dangle
        _tag: opaque.__OPAQUE_KEY__,
        _variation: variation,
        // eslint-disable-next-line @typescript-eslint/ban-ts-comment
        // @ts-ignore
        ...opaque.value,
      }),
      // eslint-disable-next-line @typescript-eslint/ban-ts-comment
      // @ts-ignore
      ({
        _tag,
        _variation,
        ...value
      }: TaggedTypes<Names, Variations, Types>[Names]) => ({
        __OPAQUE__: '__OPAQUE__',
        __OPAQUE_KEY__: _tag,
        __OPAQUE_VARIATION__: variation,
        value,
      }),
    );

    const lensFromProp = (<Prop>(prop: Prop) => {
      // eslint-disable-next-line @typescript-eslint/ban-ts-comment
      // @ts-ignore
      const lens = Lens.fromProp()(prop);

      // eslint-disable-next-line @typescript-eslint/ban-ts-comment
      // @ts-ignore
      return iso.composeLens(lens);
    }) as <P extends keyof Types[Names][Variations]>(
      prop: P,
    ) => Lens<Opaques<Names, Variations>, Types[Names][Variations][P]>;

    // eslint-disable-next-line @typescript-eslint/ban-ts-comment
    // @ts-ignore
    const fold = createFoldObject(isTypes);

    const newForVariations = {
      ...localForVariations,
      [variation]: {
        iso,
        lensFromProp,
        fold,
      },
    };

    names.forEach((name) => {
      const reverseGet = ofsVariations[variation as Variations][name as Names];

      // eslint-disable-next-line @typescript-eslint/ban-ts-comment
      // @ts-ignore
      const localIso = new Iso(get, reverseGet);

      const nameLenses = {
        iso: localIso,
        lensFromProp: <Prop>(prop: Prop) => {
          // eslint-disable-next-line @typescript-eslint/ban-ts-comment
          // @ts-ignore
          const lens = Lens.fromProp()(prop);

          // eslint-disable-next-line @typescript-eslint/ban-ts-comment
          // @ts-ignore
          return localIso.composeLens(lens);
        },
      };

      // eslint-disable-next-line @typescript-eslint/ban-ts-comment
      // @ts-ignore
      newForVariations[variation][name] = nameLenses;
    });

    return newForVariations;
  }, {}) as ForVariations<Names, Variations, Types>;

  const iso = new Iso<
    Opaques<Names, Variations>,
    TaggedTypes<Names, Variations, Types>[Names]
  >(
    (opaque: Opaques<Names, Variations>) => ({
      // eslint-disable-next-line no-underscore-dangle
      _tag: opaque.__OPAQUE_KEY__,
      // eslint-disable-next-line no-underscore-dangle
      _variation: opaque.__OPAQUE_VARIATION__,
      // eslint-disable-next-line @typescript-eslint/ban-ts-comment
      // @ts-ignore
      ...opaque.value,
    }),
    // eslint-disable-next-line @typescript-eslint/ban-ts-comment
    // @ts-ignore
    ({
      _tag,
      _variation,
      ...value
    }: TaggedTypes<Names, Variations, Types>[Names]) => ({
      __OPAQUE__: '__OPAQUE__',
      __OPAQUE_KEY__: _tag,
      __OPAQUE_VARIATION__: _variation,
      value,
    }),
  );

  const lensFromProp = (<Prop>(prop: Prop) => {
    // eslint-disable-next-line @typescript-eslint/ban-ts-comment
    // @ts-ignore
    const lens = Lens.fromProp()(prop);

    // eslint-disable-next-line @typescript-eslint/ban-ts-comment
    // @ts-ignore
    return iso.composeLens(lens);
  }) as <P extends keyof Types[Names][Variations]>(
    prop: P,
  ) => Lens<Opaques<Names, Variations>, Types[Names][Variations][P]>;

  return {
    types,
    of: ofAll,
    is: isAll,
    fold: foldAll,
    iso,
    lensFromProp,
    ...forTypes,
    ...forVariations,
  };
}

/**
 * Same as ofVariations with a unique "default" variation
 *
 * {@link ofVariations}
 */
export function of<
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  Types extends { [key in keyof Types]: any },
>(types: Types) {
  type Names = keyof Types;

  const realTypes = {} as { [name in Names]: { default: Types[name] } };

  Object.keys(types).forEach((name) => {
    realTypes[name as Names] = { default: types[name as Names] };
  });

  return ofVariations<typeof realTypes>(realTypes);
}

/**
 * Create a new union omiting the given union's types
 *
 * @example
```typescript
const MediaAPI = Union.omit(MessageAPI, ['Text']);
```
 *
 * @typeParam Types - Union initial private types
 * @typeParam OmittedKeys - Keys of types to omit
 *
 * @returns The new union api definition
 */
export function omit<
  Types extends {
    [key in keyof Types]: {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      [key: string]: any;
    };
  },
  OmittedKeys extends keyof Types,
>(
  union: UnionAPIDef<keyof Types, keyof Types[keyof Types], Types>,
  omittedKeys: OmittedKeys[],
): UnionAPIDef<
  Exclude<keyof Types, OmittedKeys>,
  keyof Types[Exclude<keyof Types, OmittedKeys>],
  Omit<Types, OmittedKeys>
> {
  const filteredTypes = Object.keys(union.types).reduce((localTypes, key) => {
    if (omittedKeys.indexOf(key as OmittedKeys) > -1) {
      return localTypes;
    }

    return {
      ...localTypes,
      [key]: union.types[key as keyof Types],
    };
  }, {}) as Omit<Types, OmittedKeys>;

  return ofVariations(filteredTypes);
}

/**
 * Create a new union comprising only of the picked union's members
 *
 * @example
```typescript
const MediaAPI = Union.pick(MessageAPI, ['Image', 'Video']);
```
 *
 * @typeParam Types - Union initial private types
 * @typeParam OnlyKeys - Keys of types to keep
 *
 * @returns The new union api definition
 */
export function pick<
  Types extends {
    [key in keyof Types]: {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      [key: string]: any;
    };
  },
  OnlyKeys extends keyof Types,
>(
  union: UnionAPIDef<keyof Types, keyof Types[keyof Types], Types>,
  onlyKeys: OnlyKeys[],
): UnionAPIDef<OnlyKeys, keyof Types[OnlyKeys], Pick<Types, OnlyKeys>> {
  const filteredTypes = Object.keys(union.types).reduce((localTypes, key) => {
    if (onlyKeys.indexOf(key as OnlyKeys) === -1) {
      return localTypes;
    }

    return {
      ...localTypes,
      [key]: union.types[key as OnlyKeys],
    };
  }, {}) as Pick<Types, OnlyKeys>;

  return ofVariations(filteredTypes);
}

/**
 * Merge two union APIs.
 *
 * @example
```typescript
const MessageAPI = Union.of({
  ...
});

const CarAPI = Union.of({
  ...
});

const MessageAndCarsAPI = Union.merge(MessageAPI, CarAPI);
```
 *
 * @typeParam Types1 - First union private types
 * @typeParam Types2 - Second union private types
 *
 * @returns The new union api definition
 */
export function merge<
  Types1 extends {
    [key in keyof Types1]: {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      [key: string]: any;
    };
  },
  Types2 extends {
    [key in keyof Types2]: {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      [key: string]: any;
    };
  },
>(
  union1: UnionAPIDef<keyof Types1, keyof Types1[keyof Types1], Types1>,
  union2: UnionAPIDef<keyof Types2, keyof Types2[keyof Types2], Types2>,
): UnionAPIDef<
  keyof Types1 | keyof Types2,
  keyof (Types1 & Types2)[keyof Types1 | keyof Types2],
  Types1 & Types2
> {
  const types = {
    ...union1.types,
    ...union2.types,
  };

  return ofVariations(types);
}

/**
 * Create a new union omiting the given union's variances
 *
 * @example
```typescript
const MediaAPI = Union.omit(MessageAPI, ['Text']);
```
 *
 * @typeParam Types - Union initial private types
 * @typeParam OmittedKeys - Keys of types to omit
 *
 * @returns The new union api definition
 */
export function omitVariations<
  Types extends {
    [key in keyof Types]: {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      [key: string]: any;
    };
  },
  OmittedVariations extends keyof Types[keyof Types],
>(
  union: UnionAPIDef<keyof Types, keyof Types[keyof Types], Types>,
  omittedVariations: OmittedVariations[],
) {
  type Names = keyof Types;
  type Variations = keyof Types[keyof Types];

  const names = Object.keys(union.types) as Names[];
  const variations = Object.keys(union.types[names[0]]) as Variations[];

  const filteredTypes = names.reduce((localTypes, name) => {
    const localType = union.types[name];

    const filteredType = variations.reduce((localVariations, variation) => {
      if (omittedVariations.indexOf(variation as OmittedVariations) > -1) {
        return localVariations;
      }

      return {
        ...localVariations,
        [variation]: localType[variation as Variations],
      };
    }, {});

    return {
      ...localTypes,
      [name]: filteredType,
    };
  }, {}) as { [name in Names]: Omit<Types[name], OmittedVariations> };

  return ofVariations(filteredTypes);
}
