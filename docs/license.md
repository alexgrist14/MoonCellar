# License

MoonCellar is **source-available, not open source**. The terms are in
[`LICENSE`](../LICENSE) at the repository root: the MoonCellar Source-Available License 1.0,
in force since 2026-09-09. This document explains what they mean in practice.

## The short version

|                                                                |                                     |
| -------------------------------------------------------------- | ----------------------------------- |
| Use the site at [mooncellar.space](https://mooncellar.space)   | Yes — the licence does not touch it |
| Read the code, study it, learn from it                         | Yes                                 |
| Fork it, change it, run it on your own machine to try a change | Yes                                 |
| Send that change back as a pull request                        | Yes, and it is welcome              |
| Deploy your own instance, public or private                    | **No**                              |
| Reuse parts of the code in another project                     | **No**                              |
| Sell it, host it for money, build a service on it              | **No**                              |

Every right the licence does not grant is reserved. That is the default under copyright law: a
licence is a decision about which rights to give away, and the rights to deploy and to reuse
are not given away here.

## Why

The project is a running service, not a library. The code is public for three reasons — so
people can see how it works, so bugs can be found and reported precisely, and so someone who
wants a feature can implement it and send a pull request. None of those reasons require the
right to run a competing copy, so that right is the one the licence withholds.

## Running it locally is allowed, and necessary

Section 1(c) grants the right to run the software on hardware you control, to evaluate it or to
develop and test a contribution. Without that, contributing would be impossible — nobody can
write a patch they are not allowed to run.

The line is between running it for yourself and making it available to someone else. A local
`bun run dev`, a container on your own laptop, a staging copy only you can reach: allowed. A
deployment other people can open, whether it charges money or not: not allowed.

## Contributions

Section 4 is the part that matters if you send a pull request. Submitting a contribution grants
the copyright holders a perpetual, irrevocable, sublicensable licence to use it as part of the
project and to relicense it later.

This is not a formality. Without it the project could not merge a pull request at all: the
author of a patch keeps the copyright in it, and a project unable to relicense its own
contributions can never change its terms again — including changing them to something more
permissive. No separate CLA is needed; the licence carries the grant.

## What the licence does not cover

- **The public service.** Section 5 says it explicitly: using mooncellar.space is governed by
  whatever terms are published on the site, not by this licence.
- **The name and the logo.** Section 6 keeps them out. A fork is still not allowed to call
  itself MoonCellar.
- **Third-party data.** Game metadata and cover art come from IGDB under IGDB's own terms.
- **Dependencies.** Every package in `node_modules` keeps its own licence, and those are
  unaffected — depending on open source software does not require this project to be open
  source itself.
- **Earlier versions.** Section 8 leaves every version published before the relicensing commit
  on the terms it was released under. The change applies from that commit onwards and is not
  retroactive, which is a deliberate trade-off rather than an oversight.

## Enforcement, honestly

A private deployment is undetectable in practice. A public one is not, and a public instance
built on code covered by this licence is a copyright infringement that can be reported to
whoever hosts it. The name is the sharper tool of the two: a fork that also calls itself
MoonCellar is infringing section 6 on top of everything else.

## Consequences to expect

- GitHub stops showing a recognised licence next to the repository, because this one is custom.
  That is normal for source-available projects.
- The workspace manifests carry `"license": "SEE LICENSE IN LICENSE"`, the npm convention for a
  non-SPDX licence. Nothing here is published to a registry, so nothing else depends on that
  field.
- Fewer external contributions. People send pull requests to projects they use, and this
  narrows that to people who use the official site. It is the cost of the choice.

## If the terms should ever change

Changing them needs the agreement of both copyright holders, and thanks to section 4 no
contributor can block it. Moving to more permissive terms stays possible at any time. Moving
back does not: once a version has been published as free software, that version stays free.
