import {PolymerElement} from '@polymer/polymer/polymer-element.js';
import {html} from '@polymer/polymer/lib/utils/html-tag.js';
import {AmfHelperMixin} from '@api-components/amf-helper-mixin/amf-helper-mixin.js';
import '@polymer/polymer/lib/elements/dom-if.js';
import '@polymer/polymer/lib/elements/dom-repeat.js';
import '@polymer/prism-element/prism-highlighter.js';
import '@polymer/paper-tabs/paper-tabs.js';
import '@polymer/paper-tabs/paper-tab.js';
import '@polymer/iron-pages/iron-pages.js';
import '@api-components/raml-aware/raml-aware.js';
import './api-schema-render.js';

/**
 * `api-schema-document`
 *
 * A component to render XML schema with examples.
 *
 * Note, if AMF contains unresolved properties (reference-id without resolving
 * the value) this element will resolve it. `amfModel` must be set on this
 * element to resolve the references.
 *
 * ## Styling
 *
 * `<api-schema-document>` provides the following custom properties and mixins for styling:
 *
 * Custom property | Description | Default
 * ----------------|-------------|----------
 * `--api-schema-document` | Mixin applied to this elment | `{}`
 * `api-schema-render` | Mixin applied to schema renderer element | `{}`
 *
 * @customElement
 * @polymer
 * @demo demo/index.html
 * @memberof ApiElements
 * @appliesMixin AmfHelperMixin
 */
class ApiSchemaDocument extends AmfHelperMixin(PolymerElement) {
  static get template() {
    return html`
    <style>
    :host {
      display: block;
      @apply --api-schema-document;
    }
    </style>
    <prism-highlighter></prism-highlighter>
    <template is="dom-if" if="[[aware]]">
      <raml-aware raml="{{amfModel}}" scope="[[aware]]"></raml-aware>
    </template>
    <template is="dom-if" if="[[schemaOnly]]">
      <api-schema-render code="[[_raw]]"></api-schema-render>
    </template>
    <template is="dom-if" if="[[exampleOnly]]">
      <template is="dom-repeat" items="[[_examples]]">
        <api-schema-render code="[[_computeExampleValue(item)]]"></api-schema-render>
      </template>
    </template>
    <template is="dom-if" if="[[schemaAndExample]]">
      <paper-tabs class="schemas" selected="{{selectedPage}}">
        <paper-tab>Schema</paper-tab>
        <paper-tab>Examples</paper-tab>
      </paper-tabs>
      <iron-pages selected="[[selectedPage]]">
        <api-schema-render code="[[_raw]]"></api-schema-render>
        <div class="examples">
          <template is="dom-repeat" items="[[_examples]]">
            <api-schema-render code="[[_computeExampleValue(item)]]"></api-schema-render>
          </template>
        </div>
      </iron-pages>
    </template>
`;
  }

  static get is() {
    return 'api-schema-document';
  }
  static get properties() {
    return {
      /**
       * `raml-aware` scope property to use.
       */
      aware: String,
      /**
       * AMF's shape object object.
       * Values for sheba and examples are computed from this model.
       */
      shape: Object,
      /**
       * Computed `http://www.w3.org/ns/shacl#raw`
       */
      _raw: String,
      /**
       * Computed list of examples
       */
      _examples: Array,

      // Computed value, true when data contains example only
      exampleOnly: {
        type: Boolean,
        readOnly: true
      },
      // Computed value, true when data contains xml schema only
      schemaOnly: {
        type: Boolean,
        readOnly: true
      },
      // Computed value, true when data contains example and schema information
      schemaAndExample: {
        type: Boolean,
        readOnly: true
      },
      selectedPage: {
        type: Number,
        value: 0
      }
    };
  }

  static get observers() {
    return [
      '_schemaChanged(shape.*)'
    ];
  }
  /**
   * Comnputes besic properties for the view.
   * @param {Object} record `shape` change record
   */
  _schemaChanged(record) {
    this._examples = undefined;
    this._raw = undefined;

    let schema = record.base;
    let exampleOnly = false;
    let schemaOnly = false;
    let schemaAndExample = false;
    let raw;
    let examples;

    if (schema) {
      schema = this._resolve(schema);
      if (this._hasType(schema, this.ns.w3.shacl.name + 'SchemaShape') ||
        this._hasType(schema, this.ns.raml.vocabularies.shapes + 'AnyShape') ||
        this._hasType(schema, this.ns.raml.vocabularies.shapes + 'ScalarShape') ||
        this._hasType(schema, this.ns.w3.shacl.name + 'NodeShape')) {
        raw = this._getValue(schema, this.ns.raml.vocabularies.document + 'raw');
        if (!raw) {
          raw = this._getValue(schema, this.ns.w3.shacl.name + 'raw');
        }
        const key = this._getAmfKey(this.ns.raml.vocabularies.document + 'examples');
        const exs = this._ensureArray(schema[key]);
        examples = this._processExamples(exs);
      }
    }
    exampleOnly = !!(examples && examples.length && !raw);
    schemaOnly = !!(!examples && raw);
    schemaAndExample = !!(raw && examples && examples.length);
    this._setExampleOnly(exampleOnly);
    this._setSchemaOnly(schemaOnly);
    this._setSchemaAndExample(schemaAndExample);
    this._examples = examples;
    this._raw = raw;
  }

  _processExamples(examples) {
    if (!examples || !examples.length) {
      return;
    }
    return examples.map((item) => this._resolve(item));
  }

  _computeExampleValue(item) {
    item = this._resolve(item);
    let raw = this._getValue(item, this.ns.raml.vocabularies.document + 'raw');
    if (!raw) {
      raw = this._getValue(item, this.ns.w3.shacl.name + 'raw');
    }
    return raw;
  }
}
window.customElements.define(ApiSchemaDocument.is, ApiSchemaDocument);