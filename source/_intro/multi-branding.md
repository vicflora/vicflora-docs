---
extends: _layouts.vicflora
title: Multi-branding
order: 2
---

The new VicFlora infrastructure will accommodate both VicFlora and HortFlora and
potentially other floras. However, it will not be multi-tenanted in the true
sense, as that means that everything will be separate, while for floras it is
beneficial to be able to share data. Therefore, VicFlora will be merely
multi-branded, which means that as much as possible is shared, but there can be
multiple public front ends, with different designs and disseminating different
subsets of the data. This is comparable to the Hub model in ALA.

The principles are:

<div class="text-xl">

- **One** data store
- **One** API
- **One** editor
- **One** search
- **Multiple** taxon trees
- **Multiple** floras.

</div>

Authorization for the editor will be scoped to taxon trees. Different floras are
underpinned by different taxon trees or subtrees.