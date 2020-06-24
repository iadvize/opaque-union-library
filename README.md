@iadvize-oss/opaque-union library
=============================
![Continuous integration](https://github.com/iadvize/opaque-union-library/workflows/Continuous%20integration/badge.svg)

This experimental library provides helpers to create and maintain opaque domain
sumtypes in Typescript.

Inspired by https://github.com/sledorze/morphic-ts/ and
https://github.com/iadvize/opaque-type-library/.

# Example

Let's say your app deals with messages: 

```typescript
// message.ts

type $Text = {
  author: string;
  content: string;
}

type $Image = {
  author: string;
  source: string;
  description: string;
  mimetype: 'jpeg' | 'png',
}

type $Video = {
  author: string;
  source: string;
  description: string;
  autoplay: boolean;
}

type $Message = $Text | $Image | $Video;
```

These are your private types (we like to prefix them with `$`). You don't want
to expose them directly. You want to make them *opaque* for the rest of your app
and expose an API to use them.

Let's create the opaque union helper:

```typescript
// message.ts

import * as Union from '@iadvize-oss/opaque-union';

const MessageAPI = Union.of({
  Text: Union.type<$Text>(),
  Image: Union.type<$Image>(),
  Video: Union.type<$Video>(),
});

export type Text = ReturnType<typeof MessageAPI.of.Text>; // Union.Opaque<'Text'>
export type Image = ReturnType<typeof MessageAPI.of.Image>;
export type Video = ReturnType<typeof MessageAPI.of.Video>;

// this is a union of each opaque type
// ie. Text | Image | Video
export type Message = Union.Type<typeof MessageAPI>;
```

An helper for media messages only will also be helpful.

```typescript
// message.ts

import * as Union from '@iadvize-oss/opaque-union';

const MediaMessageAPI = Union.omit(MessageAPI, ['Text']);
```

You can now easily create the API you want your module to expose.

First, constructors:

```typescript
// message.ts

export const createText = MessageAPI.of.Text; // (props: $Text) => Union.Opaque<'Text'>
export const createImage = MessageAPI.of.Image;
export const createVideo = MessageAPI.of.Video;

```

To be used somewhere else in your app like that:

```typescript
import * as Message from './path/to/message.ts';

const textMessage = Message.createText({ // textMessage is opaque
  author: 'Jean',
  content: 'Hello world!',
});

const imageMessage = Message.createImage({
  author: 'Peter',
  source: 'http://...',
  description: 'A goat',
  mimetype: 'jpeg',
});
```

We can't work directly on the opaque `textMessage` or `imageMessage` variables
because we can't see what's inside.

```typescript
// Error: Property 'author' does not exist on type 'Opaque<"Text">'.
textMessage.author
```

You're safe. Only `MessageAPI` knows how to "unopaque" these variables and work
on their content. It's best to keep the API private to your `message.ts` module.

To help you do just that, you can write properties accessors easily:

```typescript
// message.ts

export const author = MessageAPI.lensFromProp('author').get;

export const content = MessageAPI.Text.lensFromProp('content').get;

export const source = MediaMessageAPI.lensFromProp('source').get;

export const description = MediaMessageAPI.lensFromProp('description').get;

export const mimetype = MessageAPI.Image.lensFromProp('mimetype').get;

export const autoplay = MessageAPI.Video.lensFromProp('autoplay').get;
```

To be used in another file like this: 

```typescript
import * as Message from './path/to/message.ts';

const textContent = Message.content(textMessage);
const imageDescription = Message.description(imageMessage);
```

You can create more powerful and time saving compound accessors as well:

```typescript
// message.ts

export const summary = MessageAPI.fold({
  Text: text => `${author(text)} send "${content(text)}"`,
  Image: image => `${author(image)} send a ${mimetype(image)} image "${description(image)}"`,
  Video: video => `${author(video)} send a video "${description(video)}"`,
});
```

To be used for example like that: 

```typescript
import * as Message from './path/to/message.ts';

function log(message: Message.Message) {
  console.log(Message.summary(message));
}
```

You can write transformations:

```typescript
// message.ts

export const addSignature = (signature: string) => MessageAPI.Text.iso.modify(
  $text => ({ ...$text, content: `${$text.content}\n${signature}` })
);
```

It's very composable. For example here with
[fp-ts](https://gcanti.github.io/fp-ts/modules/) `pipe` function:

```typescript
import { pipe } from 'fp-ts/es6/function';
import * as Message from './path/to/message.ts';

const signature = 'Jean (jean@email.com)';

const textMessageWithSignature = pipe(
  Message.createText(...),
  Message.addSignature(signature),
);
```

And finally, the classic helpers you've come to expect come bundled in:

```typescript
// message.ts

export const isText = MessageAPI.is.Text;
export const fold = MessageAPI.fold;
```

```typescript
import * as Message from './path/to/message.ts';

if (Message.isText(message)) {
  return <TextMessage message={message}>
} else {
  return <UnsupportedMessage >
}

// or

return pipe(
  message,
  Message.fold({
    Text: text => <TextMessage message={text} />,
    Image: () => <UnsupportedMessage />,
    Video: () => <UnsupportedMessage />,
  }),
);
```

# Advanced example

What if any Message should be either `Pending` or `Sent`? This is what is called
"variation" in the library.

```typescript
// message.ts

import * as Union from '@iadvize-oss/opaque-union';

const MessageAPI = Union.ofVariations({
  Text: {
    Pending: Union.type<$Text>(),
    Sent: Union.type<$Text>(),
  },
  Image: {
    Pending: Union.type<$Image>(),
    Sent: Union.type<$Image>(),
  },
});

const pendingTextMessage = MessageAPI.of.Text.Pending({ ... });
```

Using variations you can model your entities with a table, like below, while
still using all the library union helpers.

|         | Text | Image |
|---------|------|-------|
| Pending |      |       |
| Sent    |      |       |


# Install

```
npm add @iadvize-oss/opaque-union
```

# Documentation

[📖 Documentation](https://iadvize.github.io/opaque-union-library/)

# Optics

The union API exposes some [monocle-ts](https://github.com/gcanti/monocle-ts)
optics:

## `Iso`

An `Iso` is a tool to transform between two types without any loss. In our case:

```
  Opaque<Key> ---> Type (get, from, unwrap)
  Opaque<Key> <--- Type (reverseGet, to, wrap)
```

It's particulary useful to transform the private value inside the opaque but you
can also combine it with other
[monocle-ts](https://github.com/gcanti/monocle-ts) optics. 

Use `<API>.<Type>.iso` to have full control over one type and its corresponding
opaque type.

```typescript
const iso = MessageAPI.Text.iso; // Iso<Opaque<Type>, Type>

const fromOpaque: (text: Text) => $Text = iso.from;
const toOpaque: ($text: $Text) => Text = iso.to;
```

To be used like this, when you need to "unopaque" your type in a private module
function, for example:

```typescript
function translate(textMessage: Text): Text { 
  const privateContent = fromOpaque(
    textMessage, // this is an Opaque<'Text'>
  ); // "hello world"
    
  const translation = translateText(privateContent); // some magic here

  const opaqueTextMessageAgain = toOpaque(
    translation, // this is a $Text
  ); // Opaque<'Text'>

  return opaqueTextMessageAgain
}
```

You can also use the `Iso` directly for transformations:

```typescript
const iso = MessageAPI.Text.iso; // Iso<Opaque<Type>, Type>

const addSignature = (signature: string) => iso.modify(
  // you have access to the private type here
  $text => `${$text}\n${signature}`,
);
```

To be used like this:

```typescript
const textMessage: Text = ...;

const textMessageWithSignature = addSignature('Jean (jean@email.com)')(textMessage);
```

There is also a global `Iso` exposed on `<API>.iso` to switch between any opaque
and any private types. 

```typescript
const iso: Iso<
  Message, // the opaque union
  Union.Tagged<$Computer, 'Computer'> | Union.Tagged<$Smartphone, 'Smartphone'> | Union.Tagged<$Smartphone, 'Smartphone'>
> = MessageAPI.iso;
```

Where `type Tagged<T, Name> = T & { _key: Name }` is used to not lose the type
of the entity when switching from an opaque to the corresponding private type.
That's why the global `.iso` is restricted to members of the union that are
assignabled to `object`.

## `lensFromProp`

A [monocle-ts](https://github.com/gcanti/monocle-ts) `Lens` is a tool to
transform between a type and a subtype of it.

Use the global `<API>.lensFromProp` to create a `Lens` between any opaque of the
API and a property shared by all private types of the API (if any).

In your module:

```typescript
// media.ts
type $Image = {
  source: string;
}

type $Video = {
  source: string;
  autoplay: boolean;
}

const MediaAPI = Union.of({
  Image: Union.type<$Image>(),
  Video: Union.type<$Video>(),
});

export const createImage = MessageAPI.of.Image;
export const createVideo = MessageAPI.of.Video;

export const source = MediaAPI.lensFromProp('source').get;
export const updateSource = MediaAPI.lensFromProp('source').modify;
```

Somewhere else in your app:

```typescript
import * as Media from './path/to/media.ts';

const image = Media.createImage({ source: 'http://a.com/b.jpeg ' });

console.log('source: ', source(image)); // http://a.com/b.jpeg

const newImage = Media.updateSource(
  oldSource => oldSource.replace('a.com', 'static.a.com')
)(image);
```

Use `<API>.<Type>.lensFromProp` to create an `Lens<Opaque<Type>, Type[...]`.

```typescript
const videoMessage: Video = ...;

const autoplay = MediaAPI.Video.lensFromProp('autoplay').get;
const removeAutoPlay = MediaAPI.Video.lensFromProp('autoplay').set(false);
```

Somewhere else in your app:

```typescript
import * as Media from './path/to/media.ts';

const video = Media.createImage({ source: 'http://a.com/b.jpeg ', autoplay: true });

const videoWithoutAutoplay = Media.removeAutoPlay(video);
```
