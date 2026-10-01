# AuthorStatus

Inline badges describing an author's playthrough next to their name in a review or comment: the
category badge, a "mastered" badge, and the play time in hours. It is a thin composition of
`StatusBadge` and `StatusDetails`.

## When to use

- In the header of a review or comment, after the author's name (`ReviewItem`, `CommentItem`,
  `UserReviewItem`).
- For a single status chip without the extra details, use `StatusBadge` directly.

## API

| Prop         | Type                       | Default  | Purpose                                                                      |
| ------------ | -------------------------- | -------- | ---------------------------------------------------------------------------- |
| `category`   | `IPlaythrough["category"]` | required | `completed`, `wishlist`, `dropped`, `playing`, `backlog` or `played`         |
| `time`       | `number`                   | –        | Play time in hours, rendered as `"<time> h"`; `0` or missing renders nothing |
| `isMastered` | `boolean`                  | –        | Adds a second `mastered` badge                                               |

## Usage

```tsx
import { AuthorStatus } from "@/src/lib/shared/ui/AuthorStatus";

<div className={styles.entry__head}>
  <AuthorName author={review.author} />
  <AuthorStatus
    category={review.category}
    time={review.time}
    isMastered={review.isMastered}
  />
</div>;
```

## Rules and gotchas

- It returns a fragment, not a wrapper: the parent decides the layout and gap. Put it in a flex
  row, or the badges run into the surrounding text.

## Storybook

`Shared/AuthorStatus`: Completed, Mastered, Playing, Wishlist.
