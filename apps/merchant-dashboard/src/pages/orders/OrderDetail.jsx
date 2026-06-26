import { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  ArrowLeft, Mail, Phone, MapPin, Calendar, Package, Truck,
  Loader2, ImageIcon, Plus, X, CheckCircle2, Clock,
  AlertCircle, DollarSign, User, Edit2, MessageSquare,
} from 'lucide-react';
import clsx from 'clsx';
import Button from '../../components/ui/Button';
import Modal from '../../components/ui/Modal';
import {
  useOrder,
  useUpdateOrderStatus,
  useUpdateFulfillment,
  useAddOrderNote,
  useCancelOrder,
} from '../../hooks/useOrders';
import { formatPrice } from '../../utils/formatCurrency';
import { formatDateTime, formatRelativeTime } from '../../utils/formatDate';

const STATUS_OPTIONS = [
  { value: 'pending', label: 'Pending' },
  { value: 'confirmed', label: 'Confirmed' },
  { value: 'processing', label: 'Processing' },
  { value: 'shipped', label: 'Shipped' },
  { value: 'delivered', label: 'Delivered' },
  { value: 'on_hold', label: 'On Hold' },
];

const CARRIERS = ['FedEx', 'UPS', 'USPS', 'DHL', 'Royal Mail', 'Other'];

const OrderDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();

  const { data: order, isLoading } = useOrder(id);
  const updateStatusMutation = useUpdateOrderStatus();
  const updateFulfillmentMutation = useUpdateFulfillment();
  const addNoteMutation = useAddOrderNote();
  const cancelMutation = useCancelOrder();

  // Modals
  const [statusModalOpen, setStatusModalOpen] = useState(false);
  const [trackingModalOpen, setTrackingModalOpen] = useState(false);
  const [cancelModalOpen, setCancelModalOpen] = useState(false);
  const [noteText, setNoteText] = useState('');

  // Status form
  const [newStatus, setNewStatus] = useState('');
  const [statusNote, setStatusNote] = useState('');

  // Tracking form
  const [trackingForm, setTrackingForm] = useState({
    carrier: '',
    trackingNumber: '',
    trackingUrl: '',
    shippingMethod: '',
  });

  // Cancel form
  const [cancelReason, setCancelReason] = useState('');
  const [restockItems, setRestockItems] = useState(true);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-32">
        <Loader2 className="w-8 h-8 animate-spin text-primary-600" />
      </div>
    );
  }

  if (!order) {
    return (
      <div className="text-center py-32">
        <h2 className="text-xl font-bold text-dark mb-2">Order not found</h2>
        <Button onClick={() => navigate('/orders')}>Back to orders</Button>
      </div>
    );
  }

  const handleStatusUpdate = async () => {
    if (!newStatus) return;
    await updateStatusMutation.mutateAsync({
      id: order._id,
      status: newStatus,
      note: statusNote,
    });
    setStatusModalOpen(false);
    setNewStatus('');
    setStatusNote('');
  };

  const handleTrackingUpdate = async () => {
    await updateFulfillmentMutation.mutateAsync({
      id: order._id,
      data: {
        ...trackingForm,
        fulfillmentStatus: 'fulfilled',
      },
    });
    setTrackingModalOpen(false);
    setTrackingForm({ carrier: '', trackingNumber: '', trackingUrl: '', shippingMethod: '' });
  };

  const handleAddNote = async () => {
    if (!noteText.trim()) return;
    await addNoteMutation.mutateAsync({ id: order._id, note: noteText });
    setNoteText('');
  };

  const handleCancel = async () => {
    await cancelMutation.mutateAsync({
      id: order._id,
      reason: cancelReason,
      restockItems,
    });
    setCancelModalOpen(false);
  };

  const canCancel = !['cancelled', 'refunded', 'delivered'].includes(order.status);
  const canFulfill = !['cancelled', 'refunded'].includes(order.status);

  return (
    <div className="space-y-6 animate-fade-in pb-12">
      {/* Header */}
      <div className="flex items-center justify-between gap-4 flex-wrap">
        <div className="flex items-center gap-3 min-w-0">
          <button
            onClick={() => navigate('/orders')}
            className="w-9 h-9 rounded-lg hover:bg-gray-100 flex items-center justify-center transition-colors flex-shrink-0"
          >
            <ArrowLeft className="w-5 h-5 text-gray-600" />
          </button>
          <div className="min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <h1 className="text-xl sm:text-2xl font-bold text-dark">
                Order {order.orderNumber}
              </h1>
              <span className={clsx(
                'inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium',
                {
                  'bg-green-100 text-green-700': order.status === 'delivered',
                  'bg-indigo-100 text-indigo-700': order.status === 'shipped',
                  'bg-purple-100 text-purple-700': order.status === 'processing',
                  'bg-blue-100 text-blue-700': order.status === 'confirmed',
                  'bg-gray-100 text-gray-700': order.status === 'pending',
                  'bg-red-100 text-red-700': order.status === 'cancelled',
                  'bg-orange-100 text-orange-700': order.status === 'refunded',
                  'bg-yellow-100 text-yellow-700': order.status === 'on_hold',
                }
              )}>
                {order.status}
              </span>
            </div>
            <p className="text-sm text-gray-500 mt-0.5 flex items-center gap-1">
              <Calendar className="w-3.5 h-3.5" />
              {formatDateTime(order.createdAt)}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          {canCancel && (
            <Button
              variant="outline"
              onClick={() => setCancelModalOpen(true)}
            >
              Cancel order
            </Button>
          )}
          {canFulfill && order.fulfillmentStatus !== 'fulfilled' && (
            <Button onClick={() => setTrackingModalOpen(true)}>
              <Truck className="w-4 h-4" />
              Mark as fulfilled
            </Button>
          )}
          <Button
            variant="outline"
            onClick={() => setStatusModalOpen(true)}
          >
            <Edit2 className="w-4 h-4" />
            Update status
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* LEFT COLUMN */}
        <div className="lg:col-span-2 space-y-6">
          {/* Items */}
          <div className="bg-white rounded-xl border border-gray-200 p-6">
            <h3 className="font-bold text-dark mb-4 flex items-center gap-2">
              <Package className="w-5 h-5" />
              Items ({order.items.length})
            </h3>

            <div className="space-y-4">
              {order.items.map((item, idx) => (
                <div key={idx} className="flex gap-4 pb-4 border-b border-gray-100 last:border-0 last:pb-0">
                  <div className="w-20 h-20 rounded-lg bg-gray-100 overflow-hidden flex-shrink-0">
                    {item.image ? (
                      <img src={item.image} alt={item.title} className="w-full h-full object-cover" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center">
                        <ImageIcon className="w-8 h-8 text-gray-300" />
                      </div>
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-dark line-clamp-2">{item.title}</p>
                    {item.sku && <p className="text-xs text-gray-500 mt-0.5">SKU: {item.sku}</p>}
                    <p className="text-sm text-gray-600 mt-2">
                      {formatPrice(item.price, order.pricing?.currency)} × {item.quantity}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="font-bold text-dark">
                      {formatPrice(item.totalPrice, order.pricing?.currency)}
                    </p>
                  </div>
                </div>
              ))}
            </div>

            {/* Totals */}
            <div className="mt-6 pt-6 border-t border-gray-200 space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-gray-600">Subtotal</span>
                <span className="font-medium">
                  {formatPrice(order.pricing?.subtotal, order.pricing?.currency)}
                </span>
              </div>
              {order.pricing?.discountAmount > 0 && (
                <div className="flex justify-between text-success">
                  <span>Discount</span>
                  <span>-{formatPrice(order.pricing?.discountAmount, order.pricing?.currency)}</span>
                </div>
              )}
              <div className="flex justify-between">
                <span className="text-gray-600">Shipping</span>
                <span className="font-medium">
                  {order.pricing?.shippingCost === 0
                    ? <span className="text-success">FREE</span>
                    : formatPrice(order.pricing?.shippingCost, order.pricing?.currency)
                  }
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Tax</span>
                <span className="font-medium">
                  {formatPrice(order.pricing?.taxAmount, order.pricing?.currency)}
                </span>
              </div>
              <div className="flex justify-between pt-3 border-t border-gray-100">
                <span className="font-bold text-dark">Total</span>
                <span className="font-bold text-dark text-lg">
                  {formatPrice(order.pricing?.total, order.pricing?.currency)}
                </span>
              </div>
            </div>
          </div>

          {/* Fulfillment */}
          {order.shipping?.trackingNumber && (
            <div className="bg-white rounded-xl border border-gray-200 p-6">
              <h3 className="font-bold text-dark mb-4 flex items-center gap-2">
                <Truck className="w-5 h-5" />
                Tracking Info
              </h3>
              <div className="grid grid-cols-2 gap-4 text-sm">
                {order.shipping.carrier && (
                  <div>
                    <p className="text-gray-500">Carrier</p>
                    <p className="font-medium text-dark">{order.shipping.carrier}</p>
                  </div>
                )}
                <div>
                  <p className="text-gray-500">Tracking Number</p>
                  <p className="font-medium text-dark">{order.shipping.trackingNumber}</p>
                </div>
                {order.shipping.shippedAt && (
                  <div>
                    <p className="text-gray-500">Shipped At</p>
                    <p className="font-medium text-dark">{formatDateTime(order.shipping.shippedAt)}</p>
                  </div>
                )}
                {order.shipping.deliveredAt && (
                  <div>
                    <p className="text-gray-500">Delivered At</p>
                    <p className="font-medium text-dark">{formatDateTime(order.shipping.deliveredAt)}</p>
                  </div>
                )}
              </div>
              {order.shipping.trackingUrl && (
                <a
                  href={order.shipping.trackingUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="mt-3 inline-flex items-center gap-1 text-sm text-primary-600 hover:text-primary-700 font-medium"
                >
                  View tracking →
                </a>
              )}
            </div>
          )}

          {/* Status History */}
          <div className="bg-white rounded-xl border border-gray-200 p-6">
            <h3 className="font-bold text-dark mb-4 flex items-center gap-2">
              <Clock className="w-5 h-5" />
              Timeline
            </h3>
            <div className="space-y-3">
              {order.statusHistory?.slice().reverse().map((entry, idx) => (
                <div key={idx} className="flex gap-3">
                  <div className="w-2 h-2 rounded-full bg-primary-600 mt-2 flex-shrink-0" />
                  <div className="flex-1">
                    <p className="text-sm">
                      <span className="font-medium text-dark capitalize">
                        {entry.type === 'status' ? `Status: ${entry.from || 'new'} → ${entry.to}` : entry.type}
                      </span>
                    </p>
                    {entry.note && (
                      <p className="text-sm text-gray-600 mt-0.5">{entry.note}</p>
                    )}
                    <p className="text-xs text-gray-500 mt-0.5">
                      {formatDateTime(entry.changedAt)}
                      {entry.changedBy && (
                        <span> by {entry.changedBy.firstName} {entry.changedBy.lastName}</span>
                      )}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Notes */}
          <div className="bg-white rounded-xl border border-gray-200 p-6">
            <h3 className="font-bold text-dark mb-4 flex items-center gap-2">
              <MessageSquare className="w-5 h-5" />
              Internal Notes
            </h3>

            {order.merchantNotes?.length > 0 && (
              <div className="space-y-3 mb-4">
                {order.merchantNotes.map((note, idx) => (
                  <div key={idx} className="bg-gray-50 rounded-lg p-3">
                    <p className="text-sm text-dark">{note.note}</p>
                    <p className="text-xs text-gray-500 mt-1">
                      {note.author && `${note.author.firstName} ${note.author.lastName} • `}
                      {formatRelativeTime(note.createdAt)}
                    </p>
                  </div>
                ))}
              </div>
            )}

            <div className="flex gap-2">
              <input
                type="text"
                placeholder="Add a note..."
                value={noteText}
                onChange={(e) => setNoteText(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleAddNote()}
                className="flex-1 px-4 py-2 rounded-lg border border-gray-300 bg-white text-sm focus:border-primary-500 focus:ring-2 focus:ring-primary-200"
              />
              <Button
                onClick={handleAddNote}
                loading={addNoteMutation.isPending}
                disabled={!noteText.trim()}
              >
                <Plus className="w-4 h-4" />
                Add
              </Button>
            </div>

            {order.customerNote && (
              <div className="mt-4 pt-4 border-t border-gray-100">
                <p className="text-xs text-gray-500 mb-1">Customer note</p>
                <p className="text-sm text-dark italic">"{order.customerNote}"</p>
              </div>
            )}
          </div>
        </div>

        {/* RIGHT COLUMN — Sidebar */}
        <div className="space-y-6">
          {/* Customer */}
          <div className="bg-white rounded-xl border border-gray-200 p-6">
            <h3 className="font-bold text-dark mb-4 flex items-center gap-2">
              <User className="w-5 h-5" />
              Customer
            </h3>
            <div className="space-y-2 text-sm">
              <p className="font-semibold text-dark">
                {order.customerSnapshot?.firstName} {order.customerSnapshot?.lastName}
              </p>
              <p className="text-gray-600 flex items-center gap-2">
                <Mail className="w-4 h-4" />
                {order.customerSnapshot?.email}
              </p>
              {order.customerSnapshot?.phone && (
                <p className="text-gray-600 flex items-center gap-2">
                  <Phone className="w-4 h-4" />
                  {order.customerSnapshot.phone}
                </p>
              )}
              {order.isGuestOrder && (
                <span className="inline-block px-2 py-0.5 bg-gray-100 text-gray-700 text-xs font-medium rounded mt-2">
                  Guest checkout
                </span>
              )}
            </div>
          </div>

          {/* Shipping Address */}
          <div className="bg-white rounded-xl border border-gray-200 p-6">
            <h3 className="font-bold text-dark mb-4 flex items-center gap-2">
              <MapPin className="w-5 h-5" />
              Shipping Address
            </h3>
            <div className="text-sm text-gray-700 space-y-0.5">
              <p className="font-medium text-dark">
                {order.shippingAddress?.firstName} {order.shippingAddress?.lastName}
              </p>
              <p>{order.shippingAddress?.line1}</p>
              {order.shippingAddress?.line2 && <p>{order.shippingAddress.line2}</p>}
              <p>
                {order.shippingAddress?.city}
                {order.shippingAddress?.state && `, ${order.shippingAddress.state}`}{' '}
                {order.shippingAddress?.zipCode}
              </p>
              <p>{order.shippingAddress?.country}</p>
              {order.shippingAddress?.phone && (
                <p className="pt-1">{order.shippingAddress.phone}</p>
              )}
            </div>
          </div>

          {/* Payment */}
          <div className="bg-white rounded-xl border border-gray-200 p-6">
            <h3 className="font-bold text-dark mb-4 flex items-center gap-2">
              <DollarSign className="w-5 h-5" />
              Payment
            </h3>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-gray-600">Status</span>
                <span className="font-medium text-dark capitalize">{order.paymentStatus}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Method</span>
                <span className="font-medium text-dark capitalize">
                  {order.payment?.method || '—'}
                </span>
              </div>
              {order.payment?.paidAt && (
                <div className="flex justify-between">
                  <span className="text-gray-600">Paid At</span>
                  <span className="font-medium text-dark">
                    {formatDateTime(order.payment.paidAt)}
                  </span>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Status Update Modal */}
      <Modal
        isOpen={statusModalOpen}
        onClose={() => setStatusModalOpen(false)}
        title="Update order status"
        size="sm"
        footer={
          <div className="flex justify-end gap-3">
            <Button variant="outline" onClick={() => setStatusModalOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleStatusUpdate} loading={updateStatusMutation.isPending}>
              Update status
            </Button>
          </div>
        }
      >
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-dark mb-1.5">
              New status
            </label>
            <select
              value={newStatus}
              onChange={(e) => setNewStatus(e.target.value)}
              className="w-full px-4 py-2.5 rounded-lg border border-gray-300 bg-white text-sm focus:border-primary-500 focus:ring-2 focus:ring-primary-200"
            >
              <option value="">Select status...</option>
              {STATUS_OPTIONS.map((opt) => (
                <option key={opt.value} value={opt.value}>
                  {opt.label}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-dark mb-1.5">
              Note (optional)
            </label>
            <textarea
              value={statusNote}
              onChange={(e) => setStatusNote(e.target.value)}
              rows={3}
              placeholder="Add a note about this status change..."
              className="w-full px-4 py-2.5 rounded-lg border border-gray-300 bg-white text-sm focus:border-primary-500 focus:ring-2 focus:ring-primary-200 resize-none"
            />
          </div>
        </div>
      </Modal>

      {/* Tracking Modal */}
      <Modal
        isOpen={trackingModalOpen}
        onClose={() => setTrackingModalOpen(false)}
        title="Mark as fulfilled"
        description="Add shipping details to mark this order as fulfilled"
        size="md"
        footer={
          <div className="flex justify-end gap-3">
            <Button variant="outline" onClick={() => setTrackingModalOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleTrackingUpdate} loading={updateFulfillmentMutation.isPending}>
              <Truck className="w-4 h-4" />
              Fulfill order
            </Button>
          </div>
        }
      >
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-dark mb-1.5">
                Carrier
              </label>
              <select
                value={trackingForm.carrier}
                onChange={(e) => setTrackingForm({ ...trackingForm, carrier: e.target.value })}
                className="w-full px-4 py-2.5 rounded-lg border border-gray-300 bg-white text-sm focus:border-primary-500 focus:ring-2 focus:ring-primary-200"
              >
                <option value="">Select carrier...</option>
                {CARRIERS.map((carrier) => (
                  <option key={carrier} value={carrier}>{carrier}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-dark mb-1.5">
                Shipping method
              </label>
              <input
                type="text"
                value={trackingForm.shippingMethod}
                onChange={(e) => setTrackingForm({ ...trackingForm, shippingMethod: e.target.value })}
                placeholder="e.g. Express, Standard"
                className="w-full px-4 py-2.5 rounded-lg border border-gray-300 bg-white text-sm focus:border-primary-500 focus:ring-2 focus:ring-primary-200"
              />
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-dark mb-1.5">
              Tracking number
            </label>
            <input
              type="text"
              value={trackingForm.trackingNumber}
              onChange={(e) => setTrackingForm({ ...trackingForm, trackingNumber: e.target.value })}
              placeholder="e.g. 1Z999AA10123456784"
              className="w-full px-4 py-2.5 rounded-lg border border-gray-300 bg-white text-sm focus:border-primary-500 focus:ring-2 focus:ring-primary-200"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-dark mb-1.5">
              Tracking URL (optional)
            </label>
            <input
              type="url"
              value={trackingForm.trackingUrl}
              onChange={(e) => setTrackingForm({ ...trackingForm, trackingUrl: e.target.value })}
              placeholder="https://..."
              className="w-full px-4 py-2.5 rounded-lg border border-gray-300 bg-white text-sm focus:border-primary-500 focus:ring-2 focus:ring-primary-200"
            />
          </div>
        </div>
      </Modal>

      {/* Cancel Modal */}
      <Modal
        isOpen={cancelModalOpen}
        onClose={() => setCancelModalOpen(false)}
        title="Cancel order?"
        size="sm"
        footer={
          <div className="flex justify-end gap-3">
            <Button variant="outline" onClick={() => setCancelModalOpen(false)}>
              Keep order
            </Button>
            <Button variant="danger" onClick={handleCancel} loading={cancelMutation.isPending}>
              Cancel order
            </Button>
          </div>
        }
      >
        <div className="space-y-4">
          <p className="text-gray-700">
            Are you sure you want to cancel order{' '}
            <span className="font-semibold">{order.orderNumber}</span>?
          </p>
          <div>
            <label className="block text-sm font-medium text-dark mb-1.5">
              Reason (optional)
            </label>
            <textarea
              value={cancelReason}
              onChange={(e) => setCancelReason(e.target.value)}
              rows={2}
              placeholder="e.g. Customer requested..."
              className="w-full px-4 py-2.5 rounded-lg border border-gray-300 bg-white text-sm focus:border-primary-500 focus:ring-2 focus:ring-primary-200 resize-none"
            />
          </div>
          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="checkbox"
              checked={restockItems}
              onChange={(e) => setRestockItems(e.target.checked)}
              className="w-4 h-4 rounded border-gray-300 text-primary-600"
            />
            <span className="text-sm text-gray-700">
              Restock items back to inventory
            </span>
          </label>
        </div>
      </Modal>
    </div>
  );
};

export default OrderDetail;