package lila.blog

import io.prismic.Document

import lila.hub.actorApi.timeline.BlogPost
import lila.timeline.{ Entry, EntryApi }

private[blog] final class Notifier(
    blogApi: BlogApi,
    timelineApi: EntryApi
) {

  def apply(prismicId: String): Funit =
    blogApi.prismicApi flatMap { prismicApi =>
      blogApi.one(prismicApi, none, prismicId) err
        s"No such document: $prismicId" flatMap doSend
    }

  private def doSend(post: Document): Funit = post.getText("blog.title") ?? { title =>

    timelineApi.broadcast.insert {
      BlogPost(id = post.id, slug = post.slug, title = title)
    }
  }
}
