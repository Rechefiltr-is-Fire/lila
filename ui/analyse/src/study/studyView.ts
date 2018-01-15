import { h } from 'snabbdom'
import { VNode } from 'snabbdom/vnode'
import { bind, plural, dataIcon } from '../util';
import { view as memberView } from './studyMembers';
import { view as chapterView } from './studyChapters';
import { view as chapterNewFormView } from './chapterNewForm';
import { view as chapterEditFormView } from './chapterEditForm';
import * as commentForm from './commentForm';
import { currentComments as currentCommentsView } from './studyComments';
import * as glyphForm from './studyGlyph';
import { view as inviteFormView } from './inviteForm';
import { view as studyFormView } from './studyForm';
import { view as studyShareView } from './studyShare';
import { view as notifView } from './notif';
import { view as tagsView } from './studyTags';
import { view as serverEvalView } from './serverEval';
import * as practiceView from './practice/studyPracticeView';
import { playButtons as gbPlayButtons, overrideButton as gbOverrideButton } from './gamebook/gamebookButtons';
import { view as descView } from './chapterDescription';
import AnalyseCtrl from '../ctrl';
import { StudyCtrl, Tab } from './interfaces';
import { MaybeVNodes } from '../interfaces';

function buttons(root: AnalyseCtrl): VNode {
  const ctrl = root.study!,
  canContribute = ctrl.members.canContribute(),
  showSticky = ctrl.data.features.sticky && (canContribute || (ctrl.vm.behind && ctrl.isUpdatedRecently())),
  toolTab = ctrl.vm.toolTab();
  return h('div.study_buttons', [
    h('div.member_buttons', [
      // distinct classes (sync, write) allow snabbdom to differentiate buttons
      showSticky ? h('a.fbt.mode.sync.hint--top', {
        attrs: { 'data-hint': 'All sync members remain on the same position' },
        class: { on: ctrl.vm.mode.sticky },
        hook: bind('click', ctrl.toggleSticky)
      }, [
        ctrl.vm.behind ? h('span.behind', '' + ctrl.vm.behind) : h('i.is'),
        'Sync'
      ]) : null,
      ctrl.members.canContribute() ? h('a.fbt.mode.write.hint--top', {
        attrs: { 'data-hint': 'Write changes to the server' },
        class: { on: ctrl.vm.mode.write },
        hook: bind('click', ctrl.toggleWrite)
      }, [ h('i.is'), 'Record' ]) : null,
      h('a.fbt.tags.hint--top', {
        attrs: { 'data-hint': 'PGN tags' },
        class: { active: toolTab === 'tags' },
        hook: bind('click', () => ctrl.vm.toolTab('tags'), ctrl.redraw)
      }, [
        h('i', { attrs: dataIcon('o') })
      ]),
      ...(canContribute ? [
        h('a.fbt.comment.hint--top', {
          attrs: { 'data-hint': 'Comment this position' },
          class: { active: toolTab === 'comments' },
          hook: bind('click', () => {
            ctrl.commentForm.set(ctrl.currentChapter().id, root.path, root.node);
            ctrl.vm.toolTab('comments');
          }, ctrl.redraw)
        }, [
          h('i', { attrs: dataIcon('c') })
        ]),
        h('a.fbt.glyph.hint--top', {
          attrs: { 'data-hint': 'Annotate with glyphs' },
          class: { active: toolTab === 'glyphs' },
          hook: bind('click', () => ctrl.vm.toolTab('glyphs'), ctrl.redraw)
        }, [
          h('i.glyph-icon')
        ]),
        h('a.fbt.analysis.hint--top', {
          attrs: { 'data-hint': root.trans.noarg('computerAnalysis') },
          class: { active: toolTab === 'serverEval' },
          hook: bind('click', () => ctrl.vm.toolTab('serverEval'), ctrl.redraw)
        }, [
          h('i', { attrs: dataIcon('') })
        ])
      ] : []),
      h('a.fbt.share.hint--top', {
        attrs: { 'data-hint': 'Share & export' },
        class: { active: toolTab === 'share' },
        hook: bind('click', () => ctrl.vm.toolTab('share'), ctrl.redraw)
      }, [
        h('i', { attrs: dataIcon('z') })
      ])
    ]),
    gbOverrideButton(ctrl) || helpButton(ctrl)
  ]);
}

function helpButton(ctrl: StudyCtrl) {
  return h('span.fbt.help.hint--top', {
    attrs: { 'data-hint': 'Need help? Get the tour!' },
    hook: bind('click', ctrl.startTour)
  }, [
    h('i.text', { attrs: dataIcon('') }, 'help')
  ]);
}

function metadata(ctrl: StudyCtrl): VNode {
  const chapter = ctrl.currentChapter();
  const d = ctrl.data;
  return h('div.study_metadata.undertable', [
    h('h2.undertable_top', [
      h('span.name', [
        d.name,
        ': ' + chapter.name
      ]),
      h('span.liking.text', {
        class: { liked: d.liked },
        attrs: {
          'data-icon': d.liked ? '' : '',
          title: 'Like'
        },
        hook: bind('click', ctrl.toggleLike)
      }, '' + d.likes)
    ]),
    tagsView(ctrl)
  ]);
}

export function main(ctrl: StudyCtrl): VNode {

  const activeTab = ctrl.vm.tab();

  const makeTab = function(key: Tab, name: string) {
    return h('a.' + key, {
      class: { active: activeTab === key },
      hook: bind('mousedown', () => ctrl.vm.tab(key), ctrl.redraw)
    }, name);
  };

  const tabs = h('div.study_tabs', [
    makeTab('members', plural('Member', ctrl.members.size())),
    makeTab('chapters', plural(ctrl.relay ? 'Game' : 'Chapter', ctrl.chapters.size())),
    ctrl.members.isOwner() ? h('a.more', {
      hook: bind('click', () => ctrl.form.open(!ctrl.form.open()), ctrl.redraw)
    }, [ h('i', { attrs: dataIcon('[') }) ]) : null
    ]);

  let panel;
  if (activeTab === 'members') panel = memberView(ctrl);
  else if (activeTab === 'chapters') panel = chapterView(ctrl);

  return h('div.side_box.study_box', [
    tabs,
    panel
  ]);
}

export function contextMenu(ctrl: StudyCtrl, path: Tree.Path, node: Tree.Node): VNode[] {
  return ctrl.vm.mode.write ? [
    h('a.action', {
      attrs: dataIcon('c'),
      hook: bind('click', () => ctrl.commentForm.open(ctrl.currentChapter()!.id, path, node))
    }, 'Comment this move'),
    h('a.action.glyph-icon', {
      hook: bind('click', () => {
        ctrl.vm.toolTab('glyphs');
        ctrl.userJump(path);
      })
    }, 'Annotate with glyphs')
  ] : [];
}

export function overboard(ctrl: StudyCtrl) {
  if (ctrl.chapters.newForm.vm.open) return chapterNewFormView(ctrl.chapters.newForm);
  if (ctrl.chapters.editForm.current()) return chapterEditFormView(ctrl.chapters.editForm);
  if (ctrl.members.inviteForm.open()) return inviteFormView(ctrl.members.inviteForm);
  if (ctrl.form.open()) return studyFormView(ctrl.form);
}

export function underboard(ctrl: AnalyseCtrl): MaybeVNodes {
  if (ctrl.embed) return [];
  if (ctrl.studyPractice) return [practiceView.underboard(ctrl.study!)];
  const study = ctrl.study!, toolTab = study.vm.toolTab();
  if (study.gamebookPlay()) return [
    gbPlayButtons(ctrl),
    descView(study),
    metadata(study)
  ];
  let panel;
  switch(toolTab) {
    case 'tags':
      panel = metadata(study);
      break;
    case 'comments':
      panel = study.vm.mode.write ?
        commentForm.view(study.commentForm) :
        commentForm.viewDisabled('Press RECORD before commenting moves');
      break;
    case 'glyphs':
      panel = ctrl.path ? (
        study.vm.mode.write ?
        glyphForm.view(study.glyphForm) :
        glyphForm.viewDisabled('Press RECORD before annotating moves')
      ) : glyphForm.viewDisabled('Select a move to annotate');
      break;
    case 'serverEval':
      panel = serverEvalView(study.serverEval);
      break;
    case 'share':
      panel = studyShareView(study.share);
      break;
  }
  return [
    notifView(study.notif),
    currentCommentsView(ctrl, toolTab !== 'comments'),
    buttons(ctrl),
    panel,
    descView(study)
  ];
}
