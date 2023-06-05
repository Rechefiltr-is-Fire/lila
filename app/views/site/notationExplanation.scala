package views.html.site

import lila.api.Context
import lila.app.templating.Environment._
import lila.app.ui.ScalatagsTemplate._

object notationExplanation {

  def apply(doc: io.prismic.Document)(implicit ctx: Context) =
    views.html.base.layout(
      moreCss = cssTag("notation-explanation"),
      title = ~doc.getText("doc.title"),
      withHrefLangs = none
    ) {
      main(cls := "page-small box box-pad page")(
        h1(doc.getText("doc.title")),
        div(cls := "body")(
          raw(~doc.getText("doc.content"))
        )
      )
    }
}
